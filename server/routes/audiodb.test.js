const { test } = require("node:test");
const assert = require("node:assert/strict");
const { artistImagesFrom, createArtistImagesHandler } = require("./audiodb");

const mbid = "cc197bad-dc9c-440d-a5b5-d52ba2e14234";
const call = async (handler, query = { mbid }) => {
  const result = { status: 200 };
  const res = {
    status(code) { result.status = code; return this; },
    set(name, value) { result[name] = value; return this; },
    json(body) { result.body = body; return this; },
  };
  await handler({ query }, res);
  return result;
};

test("artist images keep approved TheAudioDB image hosts and deduplicate URLs", () => {
  const result = artistImagesFrom({
    artists: [{
      idArtist: "111239",
      strArtist: "Coldplay",
      strMusicBrainzID: "cc197bad-dc9c-440d-a5b5-d52ba2e14234",
      strArtistThumb: "https://r2.theaudiodb.com/images/media/artist/thumb/one.jpg",
      strArtistFanart: "https://r2.theaudiodb.com/images/media/artist/fanart/two.jpg",
      strArtistFanart2: "https://r2.theaudiodb.com/images/media/artist/fanart/two.jpg",
      strArtistFanart3: "https://example.com/untrusted.jpg",
      strArtistFanart4: "javascript:alert(1)",
    }],
  }, mbid);
  assert.equal(result.artistName, "Coldplay");
  assert.equal(result.sourceUrl, "https://www.theaudiodb.com/artist/111239");
  assert.deepEqual(result.images.map((image) => image.imageUrl), [
    "https://r2.theaudiodb.com/images/media/artist/thumb/one.jpg",
    "https://r2.theaudiodb.com/images/media/artist/fanart/two.jpg",
  ]);
});

test("artist without artwork returns an empty gallery", () => {
  assert.deepEqual(artistImagesFrom({ artists: null }).images, []);
});

test("artist MBID mismatch cannot show another artist's images", () => {
  const result = artistImagesFrom({
    artists: [{ strMusicBrainzID: "different-id", strArtistThumb: "https://r2.theaudiodb.com/image.jpg" }],
  }, mbid);
  assert.deepEqual(result.images, []);
});

test("artist lookup validates MBID and caches successful results", async () => {
  let calls = 0;
  const handler = createArtistImagesHandler({
    fetchArtist: async (_url, { params }) => {
      calls++;
      assert.equal(params.i, mbid);
      return { artists: [{
        idArtist: "111239",
        strArtist: "Coldplay",
        strMusicBrainzID: mbid,
        strArtistThumb: "https://r2.theaudiodb.com/image.jpg",
      }] };
    },
  });
  assert.equal((await call(handler, { mbid: "invalid" })).status, 400);
  const [first, second] = await Promise.all([call(handler), call(handler)]);
  assert.equal(first.body.images.length, 1);
  assert.deepEqual(first.body, second.body);
  await call(handler);
  assert.equal(calls, 1);
});
