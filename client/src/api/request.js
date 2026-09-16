// O irmão do `server/http.js`, do lado do browser. Existe separado do `api.js` pelo
// mesmo motivo que lá: o `api.js` lê `import.meta.env` no topo e por isso não carrega
// fora do Vite — o node:test não o alcança. Aqui não há nada de Vite, então dá para testar.
//
// Era o axios: 50,5 kB no chunk de entrada para dois GETs, uma querystring e um timeout.
// O que ele fazia e precisa continuar valendo está tudo abaixo — inclusive o formato do
// erro, que o `queries.js` lê (`err.status === 401`) e o React Query propaga.

const TIMEOUT_MS = 10_000;

// Diferente do axios, o fetch só rejeita quando não houve resposta. 404 e 500 chegam
// como sucesso, então o erro é montado aqui.
const failure = (message, extra) => Object.assign(new Error(message), extra);

export async function request(url, { params, timeout = TIMEOUT_MS } = {}) {
  // Parâmetro sem valor some da URL, como no axios. Sem isso um `undefined` vira a
  // string "undefined" e a busca sai errada em vez de sair vazia.
  const query = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null),
  ).toString();

  let response;
  try {
    response = await fetch(query ? `${url}?${query}` : url, {
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    // Rede fora, DNS, CORS ou estouro do timeout: não existe resposta, logo não existe
    // status. Quem trata erro distingue os dois casos justamente pela ausência dele.
    throw failure(
      err.name === "TimeoutError" ? "Request timed out" : err.message || "No response received",
    );
  }

  // Corpo vazio ou não-JSON (um 502 em HTML do proxy) não pode virar exceção de parse
  // e esconder o status, que é a informação útil.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // O servidor responde `{ error }` nas dez rotas; `message` é o que terceiro manda.
    // O axios só olhava `message`, então todo erro nosso chegava como "Request failed".
    throw failure(data?.message || data?.error || "Request failed", {
      status: response.status,
      data,
    });
  }

  return { data };
}
