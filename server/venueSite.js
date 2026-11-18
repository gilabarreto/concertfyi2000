// "About" de uma venue lido do próprio site dela, quando nenhuma outra fonte tem descrição.
// Aprovado pelo dono em 2026-11-17, com estas regras: identificado como ConcertFYI, respeita o
// robots.txt, uma página só (a que o OSM/Overture dão como site) e só a descrição curta que o
// próprio site publica para buscadores e redes sociais. Falhou ou não tem: fica sem About.
const USER_AGENT = "ConcertFYI/1.0 (https://concertfyi.com)";
const MAX_HTML = 512 * 1024;

// O texto vem de site de terceiro e vai para a página: só texto puro, entidades decodificadas,
// espaços normalizados. O React escapa na hora de mostrar.
const decode = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
const attrValue = (tag, name) => {
  const m = attr(tag, name);
  return m ? (m[2] ?? m[3]) : "";
};

// og:description primeiro (costuma ser o texto escrito para quem compartilha), depois a meta
// description, depois o description do schema.org.
function descriptionFrom(html) {
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  const meta = (key) =>
    metas.find((tag) =>
      [attrValue(tag, "property"), attrValue(tag, "name")].some(
        (value) => value.toLowerCase() === key,
      ),
    );
  for (const key of ["og:description", "description", "twitter:description"]) {
    const tag = meta(key);
    if (tag) return decode(attrValue(tag, "content"));
  }
  for (const [, json] of html.matchAll(
    /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const found = json.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (found) {
      try {
        return decode(JSON.parse(`"${found[1]}"`));
      } catch {
        /* JSON-LD malformado: segue para o próximo */
      }
    }
  }
  return "";
}

// Curto demais é slogan ou "Home"; longo demais não é a descrição curta. Palavras grudadas
// ("2027CalgaryMacEwan", agenda de shows colada) e vírgula sem espaço ("pub Ottawa,Canadian pub",
// lista de palavras-chave para buscador) não são texto para gente: melhor sem About.
// ponytail: heurística medida em 7 sites de Calgary; trocar por algo melhor se aparecer lixo.
const looksLikeProse = (text) =>
  text.length >= 40 &&
  text.length <= 1000 &&
  (text.match(/[a-z0-9][A-Z]/g) || []).length <= 1 &&
  (text.match(/,\S/g) || []).length <= 1;

// Grupos do robots.txt para "*" ou para o nosso nome; um Disallow que cubra o caminho barra.
function robotsAllow(robots, path) {
  let applies = false;
  let inAgents = false;
  const rules = [];
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (!key) continue;
    if (/^user-agent$/i.test(key)) {
      if (!inAgents) applies = false;
      inAgents = true;
      if (value === "*" || /concertfyi/i.test(value)) applies = true;
      continue;
    }
    inAgents = false;
    if (applies && /^(dis)?allow$/i.test(key) && value)
      rules.push({
        allow: /^allow$/i.test(key),
        // "$" no fim pede o caminho exato; "*" vira fim do prefixo (o resto não é checado).
        exact: value.endsWith("$") && !value.includes("*"),
        prefix: value.replace(/\$$/, "").replace(/\*.*$/, ""),
      });
  }
  // A regra mais específica (prefixo mais longo) vence, como no padrão do robots.txt.
  const match = rules
    .filter((rule) => (rule.exact ? path === rule.prefix : path.startsWith(rule.prefix)))
    // Empate: a menos restritiva (Allow) vence, como no padrão.
    .sort((a, b) => b.prefix.length - a.prefix.length || b.allow - a.allow)[0];
  return !match || match.allow;
}

// Endereço vindo de base de terceiro: só http(s) na porta padrão e nome de domínio, nunca IP
// literal nem localhost, para a chamada não ser apontada para dentro.
function publicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || url.port || url.username) return null;
  const host = url.hostname;
  if (
    !host.includes(".") ||
    /^[\d.]+$/.test(host) ||
    host.includes(":") ||
    /localhost$/i.test(host)
  )
    return null;
  return url;
}

function createSiteAbout({ fetchImpl = fetch } = {}) {
  const get = async (url, timeout) => {
    const response = await fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,text/plain" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeout),
    });
    return response;
  };

  // Devolve o texto, ou "" quando não há (isso é resposta, guardada); lança quando o site falhou
  // (o store tenta de novo na próxima visita).
  return async function siteAbout(website) {
    const url = publicUrl(website);
    if (!url) return "";
    const robots = await get(`${url.origin}/robots.txt`, 3000);
    if (robots.status >= 500) throw new Error(`robots.txt ${robots.status}`);
    if (robots.ok && !robotsAllow((await robots.text()).slice(0, 64 * 1024), url.pathname))
      return "";
    const page = await get(url.href, 5000);
    if (page.status >= 500) throw new Error(`site ${page.status}`);
    if (!page.ok || !/html/i.test(page.headers.get("content-type") || "")) return "";
    const text = descriptionFrom((await page.text()).slice(0, MAX_HTML));
    return looksLikeProse(text) ? text : "";
  };
}

module.exports = { createSiteAbout, descriptionFrom, looksLikeProse, robotsAllow, publicUrl };
