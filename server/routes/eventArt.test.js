const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createEventArtHandler, matchEvent, sameVenue } = require("./eventArt");

const mbid = "39ab1aed-75e0-4140-bd47-540276886b60";
const input = { mbid, date: "2025-07-04", venue: "Principality Stadium", city: "Cardiff" };
const event = {
  id: "b675b104-8a95-414f-9b83-fd11f502d82f",
  name: "Oasis at Principality Stadium",
  "life-span": { begin: input.date, end: input.date },
  relations: [
    { type: "main performer", artist: { id: mbid } },
    { type: "held at", place: { name: "Stadiwm Principality Stadium" } },
  ],
};
const call = async (handler, query = input) => {
  const result = { status: 200 };
  const res = {
    status(code) { result.status = code; return this; },
    set(name, value) { result[name] = value; return this; },
    json(body) { result.body = body; return this; },
  };
  await handler({ query }, res);
  return result;
};

test("matches artist, date and venue, rejects ambiguous or unrelated events", () => {
  assert.equal(matchEvent([event], input), event);
  assert.equal(matchEvent([event, { ...event, id: "another-performance" }], input), null);
  assert.equal(matchEvent([event], { ...input, date: "2025-07-05" }), null);
  assert.equal(matchEvent([event], { ...input, venue: "Wembley Stadium" }), null);
  assert.equal(matchEvent([event], { ...input, mbid: "cc197bad-dc9c-440d-a5b5-d52ba2e14234" }), null);
  assert.equal(matchEvent([{ ...event, cancelled: true }], input), null);
  assert.equal(matchEvent([{ ...event, "life-span": { begin: input.date, end: "2025-07-06" } }], input), null);
  assert.equal(sameVenue("Arena", "O2 Arena"), false);
  assert.equal(sameVenue("Royal Hall", "Royal Halls"), false);
});

test("invalid input never reaches external APIs", async () => {
  const handler = createEventArtHandler({ search: async () => assert.fail("unexpected lookup") });
  for (const query of [{}, { ...input, mbid: "bad" }, { ...input, date: "2025-02-30" },
    { ...input, date: [input.date] }, { ...input, venue: "" }, { ...input, city: {} }]) {
    assert.equal((await call(handler, query)).status, 400);
  }
});

test("returns approved posters only and shares concurrent lookups", async () => {
  let searches = 0;
  let archives = 0;
  const handler = createEventArtHandler({
    search: async () => { searches++; return { count: 1, events: [event] }; },
    fetchArchive: async () => {
      archives++;
      return { images: [
        { approved: true, types: ["Ticket"], id: 1 },
        { approved: false, types: ["Poster"], id: 2 },
        { approved: true, types: ["Poster"], id: 3 },
      ] };
    },
  });
  const [a, b] = await Promise.all([call(handler), call(handler)]);
  assert.equal(a.body.artwork.kind, "event-poster");
  assert.equal(a.body.artwork.imageUrl, `https://eventartarchive.org/event/${event.id}/3-500.jpg`);
  assert.deepEqual(a.body, b.body);
  await call(handler);
  assert.equal(searches, 1);
  assert.equal(archives, 1);
});

test("archive 404 is a cached absence, not a failed search", async () => {
  let archives = 0;
  const handler = createEventArtHandler({
    search: async () => ({ count: 1, events: [event] }),
    fetchArchive: async () => { archives++; throw Object.assign(new Error("missing"), { status: 404 }); },
  });
  const result = await call(handler);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { artwork: null });
  await call(handler);
  assert.equal(archives, 1);
});

test("outages are retryable and never cached as no artwork", async () => {
  let calls = 0;
  const handler = createEventArtHandler({
    search: async () => {
      if (++calls === 1) throw Object.assign(new Error("busy"), { status: 503 });
      return { count: 0, events: [] };
    },
  });
  assert.equal((await call(handler)).status, 503);
  assert.equal((await call(handler)).status, 200);
  assert.equal(calls, 2);
});

test("truncated and nonmatching results do not fetch arbitrary artwork", async () => {
  for (const result of [{ count: 100, events: [event] }, { count: 0, events: [] }]) {
    const handler = createEventArtHandler({
      search: async () => result,
      fetchArchive: async () => assert.fail("unexpected archive request"),
    });
    assert.deepEqual((await call(handler)).body, { artwork: null });
  }
});
