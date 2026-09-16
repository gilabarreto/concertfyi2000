// node --test
const { test } = require("node:test");
const assert = require("node:assert");
const { requestLog } = require("./requestLog");

// Express de mentira: só o `on("finish")` que o middleware usa.
const call = (middleware, req) => {
  const lines = [];
  let finish;
  const res = {
    statusCode: 200,
    on(event, fn) {
      if (event === "finish") finish = fn;
    },
  };

  middleware({ method: "GET", originalUrl: "/api/setlist/search", ...req }, res, () => {});
  return { res, lines, finish: () => finish() };
};

test("registra método, caminho, status e duração — uma linha só", () => {
  const lines = [];
  const { res, finish } = call(requestLog((l) => lines.push(l)));

  assert.deepStrictEqual(lines, [], "nada antes de a resposta terminar");
  res.statusCode = 429;
  finish();

  assert.strictEqual(lines.length, 1);
  assert.match(lines[0], /^GET \/api\/setlist\/search 429 \d+ms$/);
});

test("registra a rota inteira e joga a query fora", () => {
  const lines = [];
  // Duas coisas de uma vez: o prefixo `/api/ticketmaster` tem de sobreviver (o Express
  // o corta de `req.path` dentro do router) e as coordenadas de quem chamou, não.
  const { finish } = call(requestLog((l) => lines.push(l)), {
    originalUrl: "/api/ticketmaster/events?lat=-23.5&long=-46.6",
  });
  finish();

  assert.match(lines[0], /^GET \/api\/ticketmaster\/events 200 \d+ms$/);
  assert.doesNotMatch(lines[0], /23\.5|46\.6|\?/);
});
