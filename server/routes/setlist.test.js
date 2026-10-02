// node --test server/routes/setlist.test.js
// Cache das rotas paginadas: a mesma consulta não pode voltar ao setlist.fm dentro dos
// 30 min, porque a Home sozinha dispara duas por visita e a cota diária é compartilhada.
const { test } = require("node:test");
const assert = require("node:assert");

// O setlist.js desestrutura o `request` ao carregar, então o dublê entra antes do require.
const http = require("../http");
const calls = [];
http.request = async (url, { params }) => {
  calls.push({ url, params });
  if (params.cityName === "Falha") throw Object.assign(new Error("boom"), { status: 503 });
  return { total: 1, setlist: [{ id: "a" }] };
};
const setlist = require("./setlist");

const call = (url, query) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body });
        return this;
      },
    };
    setlist({ method: "GET", url, query, headers: {} }, res, reject);
  });

test("a mesma consulta paginada vai ao setlist.fm uma vez só", async () => {
  const query = { artistMbid: "67f66c07-6e61-4026-ade5-7e782fad3a5d", tourName: "Take Cover" };
  const [a, b] = await Promise.all([call("/tour", query), call("/tour", query)]);
  await call("/tour", query);
  assert.deepStrictEqual(a.body.setlist, [{ id: "a" }]);
  assert.deepStrictEqual(b.body, a.body);
  assert.strictEqual(calls.filter((c) => c.params.tourName === "Take Cover").length, 1);
});

test("/recent usa dia inteiro no lastUpdated, para a chave do cache não mudar a cada segundo", async () => {
  await call("/recent", { cityName: "Vancouver" });
  await call("/recent", { cityName: "Vancouver" });
  const recent = calls.filter((c) => c.params.cityName === "Vancouver");
  assert.strictEqual(recent.length, 1);
  assert.match(recent[0].params.lastUpdated, /^\d{8}000000$/);
});

test("falha não fica no cache", async () => {
  assert.strictEqual((await call("/recent", { cityName: "Falha" })).status, 503);
  assert.strictEqual((await call("/recent", { cityName: "Falha" })).status, 503);
  assert.strictEqual(calls.filter((c) => c.params.cityName === "Falha").length, 2);
});
