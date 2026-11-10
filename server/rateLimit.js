// Janela fixa por IP, em memória. O Render roda uma instância só, então um Map
// resolve — Redis aqui seria infraestrutura nova para proteger uma cota de API.
// Se um dia houver mais de uma instância, cada uma passa a ter seu próprio teto.
// ponytail: no Cloudflare cada isolate tem seu Map, então o teto vale por isolate;
// o binding de rate limit do Cloudflare é a troca se um laço passar por isso.
//
// `keyOf` existe porque o IP vem de lugares diferentes: no Render é `req.ip` (trust
// proxy), no Cloudflare é o header CF-Connecting-IP, que o Cloudflare sobrescreve.
const rateLimit = ({ windowMs = 60_000, max = 60, keyOf = (req) => req.ip } = {}) => {
  const hits = new Map();
  let nextSweep = Date.now() + windowMs;

  return (req, res, next) => {
    const now = Date.now();

    // Sem isto o Map cresce com um IP por visitante para sempre. A varredura vai na
    // própria requisição e não num setInterval: o Cloudflare não deixa criar timer
    // fora de uma requisição, e assim também não sobra timer segurando teste aberto.
    if (now > nextSweep) {
      for (const [ip, hit] of hits) {
        if (now > hit.resetAt) hits.delete(ip);
      }
      nextSweep = now + windowMs;
    }

    const key = keyOf(req);
    const hit = hits.get(key);

    if (!hit || now > hit.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    hit.count += 1;
    if (hit.count > max) {
      res.set("Retry-After", String(Math.ceil((hit.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Too many requests" });
    }

    return next();
  };
};

module.exports = { rateLimit };
