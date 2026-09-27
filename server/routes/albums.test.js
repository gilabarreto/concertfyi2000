const { test } = require("node:test");
const assert = require("node:assert/strict");
const { studioAlbumsFrom, createAlbumsHandler } = require("./albums");

const mbid = "cc197bad-dc9c-440d-a5b5-d52ba2e14234";
const call = async (handler, query = { mbid }) => {
  const result = { status: 200 };
  const res = {
    status(code) { result.status = code; return this; },
    set() { return this; },
    json(body) { result.body = body; return this; },
  };
  await handler({ query }, res);
  return result;
};
const group = (id, date, secondary = []) => ({
  id, title: `T${id}`, "primary-type": "Album", "secondary-types": secondary, "first-release-date": date,
});

test("keeps dated studio albums, newest first", () => {
  const albums = studioAlbumsFrom([
    group("a", "2000-07-10"),
    group("b", "2024-10-03"),
    group("live", "2014-11-21", ["Live"]),
    group("hits", "2005", ["Compilation"]),
    group("nodate", ""),
  ]);
  assert.deepEqual(albums, [
    { id: "b", title: "Tb", year: "2024" },
    { id: "a", title: "Ta", year: "2000" },
  ]);
});

test("pages until the release-group count is reached", async () => {
  const offsets = [];
  const handler = createAlbumsHandler({
    fetchPage: async (path, params) => {
      offsets.push(params.offset);
      const all = Array.from({ length: 150 }, (_, i) => group(`g${i}`, `19${String(i % 100).padStart(2, "0")}`));
      return { "release-group-count": 150, "release-groups": all.slice(params.offset, params.offset + 100) };
    },
  });
  const { status, body } = await call(handler);
  assert.equal(status, 200);
  assert.deepEqual(offsets, [0, 100]);
  assert.equal(body.albums.length, 6);
});

test("rejects a malformed mbid without calling MusicBrainz", async () => {
  let called = false;
  const handler = createAlbumsHandler({ fetchPage: async () => { called = true; } });
  assert.equal((await call(handler, { mbid: "../x" })).status, 400);
  assert.equal(called, false);
});
