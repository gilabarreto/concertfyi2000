// node --test
const { test } = require("node:test");
const assert = require("node:assert");
const { requestLog } = require("./requestLog");

// Express de mentira: só o `on("close")` que o middleware usa, mais o `passed` — um
// log que esquece de chamar o `next()` não atrasa o site, derruba: ele é o primeiro
// middleware do `index.js`, então nenhuma resposta sairia.
const call = (middleware, req) => {
  let close;
  let passed = false;
  const res = {
    statusCode: 200,
    writableFinished: false,
    on(event, fn) {
      if (event === "close") close = fn;
    },
  };

  middleware({ method: "GET", originalUrl: "/api/setlist/search", ...req }, res, () => {
    passed = true;
  });
  return {
    res,
    passed: () => passed,
    // O caminho normal: a resposta saiu inteira antes de o socket fechar.
    finish: () => {
      res.writableFinished = true;
      close();
    },
    abort: () => close(),
  };
};

// `\d+ms` sozinho passa tanto em `0ms` quanto em `1789456123000ms` — um `Date.now()`
// sem o `- start` continuaria verde. O que se quer saber é que é tempo decorrido.
const durationOf = (line) => Number(line.match(/ (\d+)ms$/)[1]);

test("registra método, caminho, status e duração — uma linha só", () => {
  const lines = [];
  const { res, passed, finish } = call(requestLog((l) => lines.push(l)));

  assert.ok(passed(), "a requisição segue para a rota");
  assert.deepStrictEqual(lines, [], "nada antes de a resposta terminar");
  res.statusCode = 429;
  finish();

  assert.strictEqual(lines.length, 1);
  assert.match(lines[0], /^GET \/api\/setlist\/search 429 \d+ms$/);
  assert.ok(durationOf(lines[0]) < 1000);
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

test("quem desiste no meio também vira linha, e não vira um 200 falso", () => {
  const lines = [];
  const { abort } = call(requestLog((l) => lines.push(l)));
  abort();

  assert.match(lines[0], /^GET \/api\/setlist\/search ABORTED \d+ms$/);
});
