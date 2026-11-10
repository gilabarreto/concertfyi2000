// node --test
const { test } = require("node:test");
const assert = require("node:assert");
const { createYoutubeHandler } = require("./youtube");

process.env.YOUTUBE_API_KEY = "test-key";

const call = (handler, query, songCache) =>
  new Promise((resolve) => {
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
    handler({ query, app: { locals: { songCache } } }, res);
  });

const memoryKv = () => {
  const store = new Map();
  return { store, get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) };
};

test("a segunda vez sai do cache, sem gastar cota", async () => {
  let searches = 0;
  const handler = createYoutubeHandler({
    fetchJson: async () => (searches++, { items: [{ id: { videoId: "abc" } }] }),
  });
  const kv = memoryKv();

  assert.deepStrictEqual((await call(handler, { artist: "Foo Fighters", song: "Everlong" }, kv)).body, { videoId: "abc" });
  assert.deepStrictEqual((await call(handler, { artist: "foo fighters ", song: "EVERLONG" }, kv)).body, { videoId: "abc" });
  assert.strictEqual(searches, 1);
});

test("KV fora do ar não derruba a busca", async () => {
  const handler = createYoutubeHandler({ fetchJson: async () => ({ items: [{ id: { videoId: "abc" } }] }) });
  const broken = { get: async () => { throw new Error("kv down"); }, put: async () => { throw new Error("kv down"); } };

  assert.deepStrictEqual((await call(handler, { artist: "a", song: "b" }, broken)).body, { videoId: "abc" });
});

test("vídeo não achado não entra no cache", async () => {
  const handler = createYoutubeHandler({ fetchJson: async () => ({ items: [] }) });
  const kv = memoryKv();

  assert.strictEqual((await call(handler, { artist: "a", song: "b" }, kv)).status, 404);
  assert.strictEqual(kv.store.size, 0);
});

test("sem KV (Node) busca normalmente", async () => {
  const handler = createYoutubeHandler({ fetchJson: async () => ({ items: [{ id: { videoId: "x" } }] }) });
  assert.deepStrictEqual((await call(handler, { artist: "a", song: "b" })).body, { videoId: "x" });
});
