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

    // 'close' e não 'finish': o 'finish' só dispara quando a resposta saiu inteira, e
    // quem desiste no meio não gera linha nenhuma. O cliente aborta em 10 s
    // (`AbortSignal.timeout` no `request.js`), então a requisição lenta — justamente a
    // que este log existe para mostrar — era a única que sumia. O 'close' vale para os
    // dois casos, e o `writableFinished` evita o inverso: registrar como 200 uma
    // resposta que nunca chegou ao cliente.
    //
    // O cálculo do caminho mora aqui dentro, e não antes do `next()`: `req.route` só
    // existe depois que o Express bate o roteamento, e no 'close' isso já aconteceu.
    // `baseUrl + route.path` é o padrão da rota (`/api/setlist/:id`), não o valor que
    // veio na URL — sem isso, `/api/setlist/<id-do-show>` virava uma linha diferente
    // por show em vez de agregar como uma rota só. Sem match (404, ou o teste chamando
    // o middleware direto sem Express de verdade), cai para `originalUrl` — e não
    // `req.path`, que dentro de um router montado já saiu sem o prefixo. O `split` tira
    // a query. O corte em 120 é porque esse caminho cru é texto de quem chama: cabe
    // ~16 kB nele (o limite de header do Node), e o rate limit não ajuda aqui — ele
    // responde 429, mas a linha é escrita mesmo assim, de propósito. Sem o corte, um
    // cliente só enche o log do Render e empurra para fora o que interessa.
    res.on("close", () => {
      const status = res.writableFinished ? res.statusCode : "ABORTED";
      const path = req.route
        ? `${req.baseUrl}${req.route.path}`
        : req.originalUrl.split("?")[0].slice(0, 120);
      log(`${req.method} ${path} ${status} ${Date.now() - start}ms`);
    });

    next();
  };

module.exports = { requestLog };
