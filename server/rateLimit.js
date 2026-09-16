// Janela fixa por IP, em memória. O Render roda uma instância só, então um Map
// resolve — Redis aqui seria infraestrutura nova para proteger uma cota de API.
// Se um dia houver mais de uma instância, cada uma passa a ter seu próprio teto.
const rateLimit = ({ windowMs = 60_000, max = 60 } = {}) => {
  const hits = new Map();

  // Sem isto o Map cresce com um IP por visitante para sempre. unref() para o
  // timer não segurar o processo aberto em teste nem no shutdown.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, hit] of hits) {
      if (now > hit.resetAt) hits.delete(ip);
    }
  }, windowMs);
  sweep.unref();

  const middleware = (req, res, next) => {
    const now = Date.now();
    const hit = hits.get(req.ip);

    if (!hit || now > hit.resetAt) {
      hits.set(req.ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    hit.count += 1;
    if (hit.count > max) {
      res.set("Retry-After", String(Math.ceil((hit.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Too many requests" });
    }

    return next();
  };

  middleware.stop = () => clearInterval(sweep);
  return middleware;
};

module.exports = { rateLimit };
