const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mediaWikiImages, wikidataFields } = require("./apiLab");

test("Wikimedia image results expose the file page and plain license label", () => {
  const result = mediaWikiImages({
    query: {
      pages: {
        1: {
          title: "File:Foo Fighters.jpg",
          imageinfo: [{
            thumburl: "https://upload.wikimedia.org/thumb.jpg",
            descriptionurl: "https://commons.wikimedia.org/wiki/File:Foo_Fighters.jpg",
            width: 800,
            height: 600,
            extmetadata: {
              LicenseShortName: { value: "CC BY-SA 4.0" },
              Artist: { value: "<a href='/wiki/User:Photographer'>Photographer</a>" },
            },
          }],
        },
      },
    },
  });
  assert.deepEqual(result, [{
    title: "File:Foo Fighters.jpg",
    imageUrl: "https://upload.wikimedia.org/thumb.jpg",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Foo_Fighters.jpg",
    license: "CC BY-SA 4.0",
    artist: "Photographer",
    width: 800,
    height: 600,
  }]);
});

test("Wikidata response selects descriptive artist fields without returning claims wholesale", () => {
  const result = wikidataFields({
    entities: {
      Q123: {
        id: "Q123",
        labels: { en: { value: "Foo Fighters" } },
        descriptions: { en: { value: "American rock band" } },
        claims: {
          P571: [{ mainsnak: { datavalue: { value: { time: "+1994-01-01T00:00:00Z" } } } }],
          P495: [{ mainsnak: { datavalue: { value: { id: "Q30" } } } }],
          P136: [{ mainsnak: { datavalue: { value: { id: "Q11399" } } } }],
        },
      },
    },
  }, "Q123");
  assert.deepEqual(result, {
    id: "Q123",
    label: "Foo Fighters",
    description: "American rock band",
    inception: "+1994-01-01T00:00:00Z",
    countryOfOrigin: "Q30",
    genres: ["Q11399"],
    wikidataUrl: "https://www.wikidata.org/wiki/Q123",
  });
});

const { createApiLabHandler } = require("./apiLab");

function responseRecorder() {
  return {
    statusCode: 200,
    set() { return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("individual Wikipedia test does not spend quotas on other configured sources", async () => {
  const calls = [];
  const handler = createApiLabHandler({
    env: { SETLISTFM_API_KEY: "test", TICKETMASTER_API_KEY: "test", YOUTUBE_API_KEY: "test", LASTFM_API_KEY: "test", APPLE_MUSIC_DEVELOPER_TOKEN: "test", SPOTIFY_CLIENT_ID: "test", SPOTIFY_CLIENT_SECRET: "test", SONGKICK_API_KEY: "test" },
    fetchJson: async (url) => { calls.push(url); return { title: "Foo Fighters" }; },
    mbRequest: async () => { throw new Error("Unexpected MusicBrainz call"); },
  });
  const res = responseRecorder();
  await handler({ query: { source: "wikipedia" } }, res);
  assert.deepEqual(calls, ["https://en.wikipedia.org/api/rest_v1/page/summary/Foo_Fighters"]);
  assert.deepEqual(res.body.results.map(({ id, status }) => ({ id, status })), [{ id: "wikipedia", status: "ok" }]);
});

test("cover artwork test queries release groups without an unrelated artist lookup", async () => {
  const calls = [];
  const handler = createApiLabHandler({
    env: {},
    mbRequest: async (path) => { calls.push(path); return { "release-groups": [{ id: "album", title: "Album" }] }; },
    fetchJson: async (url) => { calls.push(url); return { images: [] }; },
  });
  const res = responseRecorder();
  await handler({ query: { source: "coverart" } }, res);
  assert.deepEqual(calls, ["release-group/", "https://coverartarchive.org/release-group/album"]);
  assert.equal(res.body.results.length, 1);
  assert.equal(res.body.results[0].status, "ok");
});

test("invalid source is rejected before any upstream call", async () => {
  let calls = 0;
  const handler = createApiLabHandler({ fetchJson: async () => { calls++; }, mbRequest: async () => { calls++; } });
  for (const source of ["unknown", ["wikipedia", "youtube"]]) {
    const res = responseRecorder();
    await handler({ query: { source } }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(calls, 0);
});

test("test all retains every source including unavailable sources", async () => {
  const handler = createApiLabHandler({ env: {}, fetchJson: async () => ({}), mbRequest: async () => ({}) });
  const res = responseRecorder();
  await handler({ query: {} }, res);
  assert.equal(res.body.results.length, 20);
  assert.equal(new Set(res.body.results.map((item) => item.id)).size, 20);
});

test("with API_LAB_TOKEN set, a missing or wrong password is rejected before any upstream call", async () => {
  let calls = 0;
  const handler = createApiLabHandler({
    env: { API_LAB_TOKEN: "s3cret" },
    fetchJson: async () => { calls++; return {}; },
    mbRequest: async () => { calls++; return {}; },
  });
  for (const headers of [{}, { "x-api-lab-token": "wrong" }, { "x-api-lab-token": "s3cre" }]) {
    const res = responseRecorder();
    await handler({ query: { source: "wikipedia" }, headers }, res);
    assert.equal(res.statusCode, 401);
  }
  assert.equal(calls, 0);
});

test("with API_LAB_TOKEN set, the right password runs the lab", async () => {
  const handler = createApiLabHandler({
    env: { API_LAB_TOKEN: "s3cret" },
    fetchJson: async () => ({ title: "Foo Fighters" }),
    mbRequest: async () => ({}),
  });
  const res = responseRecorder();
  await handler({ query: { source: "wikipedia" }, headers: { "x-api-lab-token": "s3cret" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.results[0].status, "ok");
});
