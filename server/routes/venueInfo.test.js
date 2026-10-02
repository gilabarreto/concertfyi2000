const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createVenueInfoHandler } = require("./venueInfo");
const { findTicketmasterVenue } = require("../venueIdentity");
const coords = { lat: 51.55, lon: -0.28 };
const value = value => [{ mainsnak: { datavalue: { value } } }];
const entity = { id: "Q128468", claims: { P625: value({ latitude: coords.lat, longitude: coords.lon }), P6375: value({ text: "Wembley Park, London HA9 0WS" }), P856: value("https://www.wembleystadium.com"), P1619: value({ time: "+2007-03-09T00:00:00Z", precision: 11 }), P571: value({ time: "+2002-01-01T00:00:00Z", precision: 9 }) } };
const page = { title: "Wembley Stadium", coordinates: [coords], extract: "Wembley Stadium is a stadium in London.", pageprops: { wikibase_item: entity.id } };
async function call(handler, query = { name: "Wembley Stadium", lat: "51.51", long: "-0.12" }) {
  const res = { code: 200, status(code) { this.code = code; return this; }, set() {}, json(data) { this.body = data; return this; } };
  await handler({ query }, res);
  return res;
}

test("venue profile combines canonical article and opening date, never construction date", async () => {
  let calls = 0;
  const handler = createVenueInfoHandler({ fetchJson: async url => { calls++; return url.includes("wikipedia") ? { query: { pages: { 1: page } } } : { entities: { [entity.id]: entity } }; } });
  const result = await call(handler);
  assert.equal(result.body.opened, "2007");
  assert.equal(result.body.address, "Wembley Park, London HA9 0WS");
  assert.equal(result.body.description, page.extract);
  assert.equal(result.body.officialWebsite, "https://www.wembleystadium.com");
  await call(handler);
  assert.equal(calls, 2, "cached venue does not spend more requests");
});

test("Wikidata remains a fallback when Wikipedia fails", async () => {
  const fallback = { ...entity, labels: { en: { value: "Wembley Stadium" } }, descriptions: { en: { value: "Stadium in London" } } };
  const handler = createVenueInfoHandler({ fetchJson: async (url, options) => {
    if (url.includes("wikipedia")) throw { status: 503 };
    if (options.params.action === "wbsearchentities") return { search: [{ id: entity.id }] };
    return { entities: { [entity.id]: fallback } };
  } });
  const result = await call(handler);
  assert.equal(result.body.opened, "2007");
  assert.equal(result.body.description, "");
  assert.equal(result.body.partial, true);
});

test("ambiguous and distant namesakes never enrich the venue", async () => {
  const handler = createVenueInfoHandler({ fetchJson: async (url, options) => {
    if (url.includes("wikipedia")) return { query: { pages: { 1: { ...page, pageprops: { disambiguation: "" } } } } };
    if (options.params.action === "wbsearchentities") return { search: [{ id: "Q1" }, { id: "Q2" }] };
    const match = { ...entity, labels: { en: { value: "Wembley Stadium" } }, descriptions: { en: { value: "Stadium" } } };
    return { entities: { Q1: { ...match, id: "Q1" }, Q2: { ...match, id: "Q2" } } };
  } });
  assert.equal((await call(handler)).body.opened, "");
  assert.equal((await call(handler, { name: "Wembley Stadium", lat: 0, long: 0 })).body.description, "");
});

test("invalid input and all-provider outages leave predictable results", async () => {
  const handler = createVenueInfoHandler({ fetchJson: async () => { throw { status: 503 }; } });
  assert.equal((await call(handler, { name: "Wembley Stadium" })).code, 400);
  const result = await call(handler);
  assert.equal(result.code, 200);
  assert.equal(result.body.address, "");
  assert.equal(result.body.partial, true);
});

test("inception is not an opening date and unsafe websites are omitted", async () => {
  const altered = { ...entity, claims: { ...entity.claims, P1619: [], P856: value("javascript:alert(1)") } };
  const handler = createVenueInfoHandler({ fetchJson: async url => url.includes("wikipedia") ? { query: { pages: { 1: page } } } : { entities: { [entity.id]: altered } } });
  const result = await call(handler);
  assert.equal(result.body.opened, "");
  assert.equal(result.body.officialWebsite, "");
});

test("Ticketmaster lookup requires one venue with compatible name and coordinates", () => {
  const venue = { name: "Wembley Stadium", location: { latitude: 51.55, longitude: -0.28 } };
  assert.equal(findTicketmasterVenue([{ name: "Wrong Arena", location: venue.location }, venue], "Wembley Stadium", 51.51, -0.12), venue);
  assert.equal(findTicketmasterVenue([venue, { ...venue }], "Wembley Stadium", 51.51, -0.12), null);
  assert.equal(findTicketmasterVenue([venue], "Wembley Stadium", 0, 0), null);
});
