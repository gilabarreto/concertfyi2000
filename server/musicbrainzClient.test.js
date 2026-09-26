const { test } = require("node:test");
const assert = require("node:assert/strict");
const { musicbrainzRequest } = require("./musicbrainzClient");

test("MusicBrainz requests share cache, deduplicate and start at most once per second", async (t) => {
  const starts = [];
  t.mock.method(global, "fetch", async (url, init) => {
    starts.push(Date.now());
    assert.match(init.headers["User-Agent"], /concertfyi/);
    return { ok: true, json: async () => ({ url }) };
  });
  const [a, b] = await Promise.all([
    musicbrainzRequest("artist/test", { inc: "genres" }),
    musicbrainzRequest("artist/test", { inc: "genres" }),
    musicbrainzRequest("event/", { query: "test" }),
  ]);
  assert.deepEqual(a, b);
  assert.equal(starts.length, 2);
  assert.ok(starts[1] - starts[0] >= 1000);
  await musicbrainzRequest("artist/test", { inc: "genres" });
  assert.equal(starts.length, 2);
});
