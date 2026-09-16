// Uma linha por requisição no stdout, que é o que o Render guarda. Sem isto o único
// rastro de um dia ruim são os `console.error` das falhas: dá para ver que quebrou,
// nunca quanto tráfego havia, o que estava lento nem quantos 429 o limite devolveu.
//
// Sem IP, sem query string. O caminho já diz qual rota foi; o que vai na query é o
// que a pessoa digitou e onde ela está, e isso não tem por que ficar guardado em log.
const requestLog =
  (log = console.log) =>
  (req, res, next) => {
    const start = Date.now();
    // `originalUrl` e não `req.path`: dentro de um router montado o Express corta o
    // prefixo, e na hora do 'finish' o caminho já saiu como `/events`, sem dizer de
    // qual API. O `split` tira a query.
    const path = req.originalUrl.split("?")[0];

    // 'finish' é o único ponto em que o status já é definitivo — logar antes registra
    // 200 para resposta que ainda vai virar 500.
    res.on("finish", () => {
      log(`${req.method} ${path} ${res.statusCode} ${Date.now() - start}ms`);
    });

    next();
  };

module.exports = { requestLog };
