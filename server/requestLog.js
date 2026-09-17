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
    // qual API. O `split` tira a query. O corte em 120 é porque o caminho é texto de
    // quem chama: cabe ~16 kB nele (o limite de header do Node), e o rate limit não
    // ajuda aqui — ele responde 429, mas a linha é escrita mesmo assim, de propósito.
    // Sem o corte, um cliente só enche o log do Render e empurra para fora o que
    // interessa. A rota mais longa que existe aqui não passa de 60 caracteres.
    const path = req.originalUrl.split("?")[0].slice(0, 120);

    // 'close' e não 'finish': o 'finish' só dispara quando a resposta saiu inteira, e
    // quem desiste no meio não gera linha nenhuma. O cliente aborta em 10 s
    // (`AbortSignal.timeout` no `request.js`), então a requisição lenta — justamente a
    // que este log existe para mostrar — era a única que sumia. O 'close' vale para os
    // dois casos, e o `writableFinished` evita o inverso: registrar como 200 uma
    // resposta que nunca chegou ao cliente.
    res.on("close", () => {
      const status = res.writableFinished ? res.statusCode : "ABORTED";
      log(`${req.method} ${path} ${status} ${Date.now() - start}ms`);
    });

    next();
  };

module.exports = { requestLog };
