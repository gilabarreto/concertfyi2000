// node --test
// As guardas de entrada das rotas: o que elas barram nunca chega às APIs de fora,
// então cada teste aqui é uma chamada de cota que deixa de ser gasta. Nenhum destes
// casos toca a rede — se algum passar da guarda, o teste falha com erro de fetch.
const { test } = require("node:test");
const assert = require("node:assert");

const ticketmaster = require("./ticketmaster");
const setlist = require("./setlist");

// Express de mentira: um router é chamável, só precisa de req.url/method e do res.
const call = (router, url, query) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      set() {
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body });
        return this;
      },
    };
    router({ method: "GET", url, query, headers: {} }, res, reject);
  });

test("/events exige coordenada de verdade", async () => {
  for (const query of [{}, { lat: "abc", long: "1" }, { lat: "91", long: "0" }, { lat: "0", long: "181" }]) {
    const { status, body } = await call(ticketmaster, "/events", query);
    assert.strictEqual(status, 400, `aceitou ${JSON.stringify(query)}`);
    assert.match(body.error, /lat\/long/);
  }
});

test("/suggest exige palavra de busca", async () => {
  for (const query of [{}, { keyword: "   " }, { keyword: "a".repeat(201) }]) {
    const { status } = await call(ticketmaster, "/suggest", query);
    assert.strictEqual(status, 400, `aceitou ${JSON.stringify(query).slice(0, 40)}`);
  }
});

test("a busca de setlist exige o nome do artista", async () => {
  // Sem nome, o parâmetro sumia e a setlist.fm devolvia a lista inteira do mundo.
  for (const query of [{}, { artistName: "" }, { artistName: "a".repeat(201) }]) {
    const { status } = await call(setlist, "/search", query);
    assert.strictEqual(status, 400, `aceitou ${JSON.stringify(query).slice(0, 40)}`);
  }
});
