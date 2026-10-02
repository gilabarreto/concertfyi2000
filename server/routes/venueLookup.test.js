const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createVenueLookupHandler } = require("./venueLookup");
const tm = { id: "KovZpZAEk11A", name: "Wembley Stadium", city: { name: "London" }, country: { name: "United Kingdom", countryCode: "GB" }, location: { latitude: "51.556", longitude: "-0.279" } };
const sf = { id: "2bd6c086", name: tm.name, city: { name: "London", country: { code: "GB" }, coords: { lat: 51.51, long: -0.12 } } };
async function call(handler, venueId = tm.id) {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
  await handler({ params: { venueId } }, res);
  return res;
}
const handlerWith = (venues) => createVenueLookupHandler({ fetchJson: async url => url.includes("ticketmaster") ? tm : { venue: venues, total: venues.length, itemsPerPage: 20 } });

test("Ticketmaster venue links resolve a unique setlist venue and retain the exact profile", async () => {
  const result = await call(handlerWith([sf, { ...sf, id: "12345678", city: { name: "London", country: { code: "CA" } } }]));
  assert.equal(result.body.setlistVenueId, sf.id);
  assert.equal(result.body.venue.id, `ticketmaster:${tm.id}`);
  assert.deepEqual(result.body.venue.city.coords, { lat: 51.556, long: -0.279 });
  assert.deepEqual(result.body.ticketmaster, tm);
});

test("ambiguous, differently named and distant venues never provide another venue's setlists", async () => {
  for (const venues of [[sf, { ...sf, id: "12345678" }], [{ ...sf, name: "Wembley Arena" }], [{ ...sf, city: { ...sf.city, coords: { lat: 0, long: 0 } } }]]) {
    assert.equal((await call(handlerWith(venues))).body.setlistVenueId, null);
  }
});

test("setlist failure preserves the Ticketmaster venue and is not cached as missing data", async () => {
  let calls = 0;
  const handler = createVenueLookupHandler({ fetchJson: async url => { calls++; if (url.includes("ticketmaster")) return tm; throw { status: 503 }; } });
  const result = await call(handler);
  assert.equal(result.body.venue.name, tm.name);
  assert.equal(result.body.partial, true);
  await call(handler);
  assert.equal(calls, 4);
});

test("lookup rejects malformed IDs before upstream calls and handles missing Ticketmaster venues", async () => {
  const handler = createVenueLookupHandler({ fetchJson: async () => { throw { status: 404 }; } });
  assert.equal((await call(handler, "../venue")).code, 400);
  assert.equal((await call(handler)).code, 404);
});
