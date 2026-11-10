// node --test
const { test } = require("node:test");
const assert = require("node:assert");
const { rateLimit } = require("./rateLimit");

// Express de mentira: só o que o middleware toca.
const call = (limiter, ip) => {
  let passed = false;
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    set(k, v) {
      this.headers[k] = v;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  limiter({ ip }, res, () => {
    passed = true;
  });
  return { passed, res };
};

test("deixa passar até o teto e barra a partir dele", () => {
  const limiter = rateLimit({ max: 3, windowMs: 60_000 });

  assert.ok(call(limiter, "1.1.1.1").passed);
  assert.ok(call(limiter, "1.1.1.1").passed);
  assert.ok(call(limiter, "1.1.1.1").passed);

  const blocked = call(limiter, "1.1.1.1");
  assert.strictEqual(blocked.passed, false);
  assert.strictEqual(blocked.res.statusCode, 429);
  assert.ok(Number(blocked.res.headers["Retry-After"]) > 0);

});

test("um IP no teto não barra os outros", () => {
  const limiter = rateLimit({ max: 1, windowMs: 60_000 });

  assert.ok(call(limiter, "1.1.1.1").passed);
  assert.strictEqual(call(limiter, "1.1.1.1").passed, false);
  // Este é o modo de falha que importa: sem trust proxy no Render, todo mundo
  // chega com o mesmo IP e o primeiro visitante derruba o site para o resto.
  assert.ok(call(limiter, "2.2.2.2").passed);

});

test("a janela reabre depois que expira", async () => {
  const limiter = rateLimit({ max: 1, windowMs: 20 });

  assert.ok(call(limiter, "1.1.1.1").passed);
  assert.strictEqual(call(limiter, "1.1.1.1").passed, false);

  await new Promise((r) => setTimeout(r, 30));
  assert.ok(call(limiter, "1.1.1.1").passed);

});

test("conta pela chave de keyOf, não por req.ip", () => {
  const limiter = rateLimit({ max: 1, keyOf: (req) => req.headers["cf-connecting-ip"] });
  const req = (ip) => ({ ip: "10.0.0.1", headers: { "cf-connecting-ip": ip } });
  const pass = (r) => {
    let passed = false;
    limiter(r, { set() { return this; }, status() { return this; }, json() { return this; } }, () => (passed = true));
    return passed;
  };

  assert.ok(pass(req("1.1.1.1")));
  assert.strictEqual(pass(req("1.1.1.1")), false);
  // Mesmo req.ip (o proxy), visitante diferente: tem que passar.
  assert.ok(pass(req("2.2.2.2")));
});
