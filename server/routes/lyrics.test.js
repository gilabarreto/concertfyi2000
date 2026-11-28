// node --test server/routes/lyrics.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");

// O lyrics.js desestrutura o `request` ao carregar, então o dublê entra antes do require.
const http = require("../http");
let answers = {};
http.request = async (url, { params }) => {
  const answer = answers[url.split("/api/")[1]];
  if (answer instanceof Error) throw answer;
  return typeof answer === "function" ? answer(params) : answer;
};
const lyrics = require("./lyrics");

const call = (query) =>
  new Promise((resolve) => {
    const res = {
      code: 200,
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        resolve({ status: this.code, body });
      },
    };
    lyrics({ query }, res);
  });
const notFound = Object.assign(new Error("not found"), { status: 404 });
const query = { artist: "Oasis", song: "Dont Look Back in Anger" };

test("exact match answers without searching", async () => {
  answers = { get: { plainLyrics: "exata" }, search: new Error("should not search") };
  assert.deepEqual(await call(query), { status: 200, body: { lyrics: "exata" } });
});

test("no exact match: search accepts the same song spelled differently", async () => {
  answers = {
    get: notFound,
    search: [
      { artistName: "Oasis Tribute", trackName: "Don't Look Back In Anger", plainLyrics: "outro" },
      { artistName: "Oasis", trackName: "Don't Look Back In Anger (Live)", plainLyrics: "ao vivo" },
      { artistName: "Oasis", trackName: "Don't Look Back In Anger", plainLyrics: "certa" },
    ],
  };
  assert.deepEqual(await call(query), { status: 200, body: { lyrics: "certa" } });
});

test("search with no same-name result is still not found", async () => {
  answers = {
    get: notFound,
    search: [{ artistName: "Oasis", trackName: "Wonderwall", plainLyrics: "outra" }],
  };
  assert.equal((await call(query)).status, 404);
});

test("LRCLIB down is an error, not a missing lyric", async () => {
  answers = { get: Object.assign(new Error("down"), { status: 503 }) };
  assert.equal((await call(query)).status, 500);
});
