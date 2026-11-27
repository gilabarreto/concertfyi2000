const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spotifyFrom, createArtistSpotifyHandler } = require("./artistSpotify");
const { createStore } = require("../store");

const mbid = "cc197bad-dc9c-440d-a5b5-d52ba2e14234";
const call = async (handler, query = { mbid }) => {
  const result = { status: 200 };
  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    set() {
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
  await handler({ query }, res);
  return result;
};
const rel = (resource) => ({ url: { resource } });

test("picks the Spotify artist page among the url relations", () => {
  const artist = {
    relations: [
      rel("https://www.youtube.com/coldplay"),
      rel("https://open.spotify.com/album/abc"),
      rel("https://open.spotify.com/artist/4gzpq5DPGxSnKTe4SA8HAU"),
    ],
  };
  assert.equal(spotifyFrom(artist), "https://open.spotify.com/artist/4gzpq5DPGxSnKTe4SA8HAU");
});

test("ignores anything that is not a plain https artist page", () => {
  for (const url of [
    "http://open.spotify.com/artist/abc",
    "https://open.spotify.com/artist/abc?si=x",
    "https://evil.example/open.spotify.com/artist/abc",
  ]) {
    assert.equal(spotifyFrom({ relations: [rel(url)] }), "");
  }
  assert.equal(spotifyFrom({}), "");
});

test("asks MusicBrainz once and serves the stored link after", async () => {
  let calls = 0;
  const handler = createArtistSpotifyHandler({
    fetchArtist: async (path, params) => {
      calls++;
      assert.equal(path, `artist/${mbid}`);
      assert.deepEqual(params, { inc: "url-rels" });
      return { relations: [rel("https://open.spotify.com/artist/X1")] };
    },
    memoryStore: createStore(),
  });
  assert.deepEqual((await call(handler)).body, { spotify: "https://open.spotify.com/artist/X1" });
  assert.deepEqual((await call(handler)).body, { spotify: "https://open.spotify.com/artist/X1" });
  assert.equal(calls, 1);
});

test("rejects a bad mbid and reports a MusicBrainz failure", async () => {
  const handler = createArtistSpotifyHandler({
    fetchArtist: async () => {
      throw Object.assign(new Error("busy"), { status: 503 });
    },
    memoryStore: createStore(),
  });
  assert.equal((await call(handler, { mbid: "x" })).status, 400);
  assert.equal((await call(handler)).status, 503);
});
