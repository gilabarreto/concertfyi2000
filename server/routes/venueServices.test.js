const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createVenueServicesHandlers } = require("./venueServices");
const query = { name: "Wembley Stadium", lat: "51.556", long: "-0.279", exact: "true" };
const osmVenue = { type: "way", id: 1, center: { lat: 51.556, lon: -0.279 }, tags: { name: query.name, wheelchair: "yes", phone: "+44 1234", opening_hours: "Mo-Fr 09:00-17:00", website: "https://www.wembleystadium.com", "payment:cash": "no" } };
async function call(handler, input = query) {
  const res = { code: 200, headers: {}, status(code) { this.code = code; return this; }, set(key, value) { this.headers[key] = value; return this; }, json(body) { this.body = body; return this; } };
  await handler({ query: input }, res);
  return res;
}

test("OSM works without a Google key, preserves negative values and caches only free content", async () => {
  let requests = 0;
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => { requests++; return { elements: [osmVenue] }; } });
  const first = await call(handlers.services);
  assert.equal(first.body.fields.phone.value, "+44 1234");
  assert.equal(first.body.fields.payments.value, "cash: no");
  assert.equal(first.body.fields.phone.source, "OpenStreetMap");
  assert.equal(first.headers["Cache-Control"], "no-store");
  await call(handlers.services);
  assert.equal(requests, 1);
  const reviews = await call(handlers.reviews);
  assert.equal(reviews.body.status, "unconfigured");
  assert.deepEqual(reviews.body.reviews, []);
  assert.equal(requests, 1, "OSM is never queried for reviews");
});

test("matching rejects namesakes, ambiguity and incomplete Overpass results", async () => {
  for (const elements of [[{ ...osmVenue, center: { lat: 0, lon: 0 } }], [osmVenue, { ...osmVenue, id: 2, center: { lat: 51.56, lon: -0.279 } }], [{ ...osmVenue, tags: { name: "Wrong Stadium" } }]]) {
    const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => ({ elements }) });
    assert.equal((await call(handlers.services)).body.fields.phone, null);
  }
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => ({ remark: "Query timed out", elements: [osmVenue] }) });
  assert.equal((await call(handlers.services)).body.partial, true);
});

test("the area and its nearby label node do not make one OSM venue ambiguous", async () => {
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => ({ elements: [osmVenue, { ...osmVenue, type: "node", lat: 51.556, lon: -0.279 }] }) });
  assert.equal((await call(handlers.services)).body.fields.phone.value, "+44 1234");
});

test("Google complements use explicit masks, fallback per missing field and never cache content", async () => {
  const requests = [];
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith("searchText")) return { places: [{ id: "test_place", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    if (url.includes("places/test_place")) return { internationalPhoneNumber: "+44 5678", accessibilityOptions: { wheelchairAccessibleEntrance: false }, paymentOptions: { acceptsCashOnly: false }, googleMapsUri: "https://maps.google.com/?cid=1" };
    return { elements: [osmVenue] };
  } });
  const result = await call(handlers.services);
  assert.equal(result.body.fields.phone.value, "+44 5678");
  assert.equal(result.body.fields.phone.source, "Google Maps");
  assert.equal(result.body.fields.openingHours.source, "OpenStreetMap");
  assert.equal(result.body.fields.accessibility.value, "Wheelchair-accessible entrance: No");
  assert.equal(result.body.fields.payments.value, "Cash only: No");
  await call(handlers.services);
  assert.equal(requests.filter(item => item.url.endsWith("searchText")).length, 1, "only the place ID is reused");
  const details = requests.filter(item => item.url.includes("places/test_place"));
  assert.equal(details.length, 2);
  assert.ok(!details[0].options.headers["X-Goog-FieldMask"].includes("reviews"));
  assert.equal(details[0].options.headers["X-Goog-Api-Key"], "test-placeholder");
  assert.ok(requests.every(item => !item.url.includes("test-placeholder")));
});

test("reviews are separate, capped at five and preserve author/source attribution", async () => {
  const masks = [];
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    if (url.endsWith("searchText")) return { places: [{ id: "test_place", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    masks.push(options.headers["X-Goog-FieldMask"]);
    return { rating: 4.5, userRatingCount: 100, googleMapsUri: "https://maps.google.com/?cid=1", reviews: Array.from({ length: 6 }, () => ({ rating: 5, text: { text: "A review" }, authorAttribution: { displayName: "Author", uri: "https://maps.google.com/user", photoUri: "https://example.com/photo" } })) };
  } });
  const result = await call(handlers.reviews);
  assert.equal(result.body.reviews.length, 5);
  assert.equal(result.body.reviews[0].author, "Author");
  assert.equal(result.body.rating, 4.5);
  assert.deepEqual(masks, ["rating,userRatingCount,reviews,googleMapsUri,attributions"]);
});

test("invalid inputs never reach providers, and failures expose no credentials", async () => {
  let requests = 0;
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async () => { requests++; throw new Error("secret upstream error"); } });
  for (const input of [{ name: "Venue" }, { ...query, lat: "" }, { ...query, lat: "91" }, { ...query, name: ["Venue"] }]) assert.equal((await call(handlers.services, input)).code, 400);
  assert.equal(requests, 0);
  const result = await call(handlers.services);
  assert.equal(result.body.partial, true);
  assert.ok(!JSON.stringify(result.body).includes("secret"));
});

test("transport stops named after a stadium cannot supply its details", async () => {
  const station = { ...osmVenue, type: "node", lat: 51.554, lon: -0.284, tags: { name: query.name, public_transport: "station", phone: "wrong station phone" } };
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => ({ elements: [station, osmVenue] }) });
  assert.equal((await call(handlers.services)).body.fields.phone.value, "+44 1234");
  const stationOnly = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => ({ elements: [station] }) });
  assert.equal((await call(stationOnly.services)).body.providers.osm, "not-found");
});

test("Google outage or an ambiguous match keeps the independent OSM fallback", async () => {
  for (const ambiguous of [false, true]) {
    let detailRequests = 0;
    const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async url => {
      if (url.endsWith("searchText")) {
        if (!ambiguous) throw new Error("quota exhausted");
        const place = { id: "same_name", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } };
        return { places: [place, { ...place, id: "other_place" }] };
      }
      if (url.includes("places.googleapis.com")) { detailRequests++; throw new Error("wrong place"); }
      return { elements: [osmVenue] };
    } });
    const result = await call(handlers.services);
    assert.equal(result.body.fields.phone.source, "OpenStreetMap");
    assert.equal(detailRequests, 0);
  }
});

test("Dickens Pub matches Dickens only with pub category and compatible coordinates; editorial About is preserved", async () => {
  const description = "Laid-back haunt for drinks, pub grub & entertainment.";
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    if (url.endsWith("searchText")) return { places: [{ id: "dickens", displayName: { text: "Dickens" }, types: ["pub", "live_music_venue"], location: { latitude: 51.0453, longitude: -114.084 } }] };
    if (url.includes("places/dickens")) {
      assert.ok(options.headers["X-Goog-FieldMask"].includes("editorialSummary"));
      return { editorialSummary: { text: description }, internationalPhoneNumber: "+1 403-233-7550", googleMapsUri: "https://maps.google.com/?cid=1" };
    }
    return { elements: [] };
  } });
  const result = await call(handlers.services, { name: "Dicken's Pub", lat: "51.05", long: "-114.085" });
  assert.equal(result.body.providers.google, "ok");
  assert.equal(result.body.fields.description.value, description);
  assert.equal(result.body.fields.description.source, "Google Maps");
  assert.equal(result.body.fields.phone.value, "+1 403-233-7550");
});

test("descriptor matching never treats arbitrary partial names as a venue match", () => {
  const { venueNamesMatch } = require("../venueIdentity");
  assert.equal(venueNamesMatch("Dicken's Pub", "Dickens", ["pub"]), true);
  assert.equal(venueNamesMatch("Dicken's Pub", "Dickens", ["book_store"]), false);
  assert.equal(venueNamesMatch("Dickens Theatre", "Dickens", ["pub"]), false);
  assert.equal(venueNamesMatch("Wembley Stadium", "Wembley", ["train_station"]), false);
  assert.equal(venueNamesMatch("Madison Square Garden", "Madison", ["arena"]), false);
  assert.equal(venueNamesMatch("Dickens", "Dickens Inn", ["pub"]), false);
});

test("OSM can supplement a pub's alternate descriptor and About, without hardcoded venue data", async () => {
  let queryText;
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async (_url, options) => {
    queryText = new URLSearchParams(options.body).get("data");
    return { elements: [{ ...osmVenue, tags: { name: "Dickens", amenity: "pub", "description:en": "An independent live music pub." } }] };
  } });
  const result = await call(handlers.services, { ...query, name: "Dicken's Pub" });
  assert.equal(result.body.fields.description.value, "An independent live music pub.");
  assert.ok(queryText.includes("D[^[:alnum:]]*i"));
});

test("profile rating uses Google's aggregate and count without downloading reviews", async () => {
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    if (url.endsWith("searchText")) return { places: [{ id: "venue", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    if (url.includes("places/venue")) {
      const mask = options.headers["X-Goog-FieldMask"].split(",");
      assert.ok(mask.includes("rating"));
      assert.ok(mask.includes("userRatingCount"));
      assert.ok(!mask.includes("reviews"));
      return { rating: 4.6, userRatingCount: 1438, googleMapsUri: "https://maps.google.com/?cid=1" };
    }
    return { elements: [] };
  } });
  const result = await call(handlers.services);
  assert.equal(result.body.fields.rating.value, 4.6);
  assert.equal(result.body.fields.rating.count, 1438);
  assert.equal(result.body.fields.rating.source, "Google Maps");
});

test("photo pages fetch fresh resources and only requested images, keeping authors and the key on the server", async () => {
  const calls = [];
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("searchText")) return { places: [{ id: "venue", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    if (url.endsWith("places/venue")) {
      assert.equal(options.headers["X-Goog-FieldMask"], "photos,googleMapsUri,attributions");
      return { googleMapsUri: "https://maps.google.com/?cid=1", photos: Array.from({ length: 10 }, (_, index) => ({ name: `places/venue/photos/photo_${index}`, authorAttributions: [{ displayName: `Author ${index}`, uri: "https://maps.google.com/author" }] })) };
    }
    assert.equal(options.params.skipHttpRedirect, true);
    return { photoUri: `https://images.example.com/${url.split("/").at(-2)}.jpg` };
  } });
  const result = await call(handlers.photos, { ...query, offset: "3", limit: "3" });
  assert.equal(result.body.total, 10);
  assert.equal(result.body.photos.length, 3);
  assert.equal(result.body.photos[0].authors[0].name, "Author 3");
  assert.equal(calls.filter(item => item.url.endsWith("/media")).length, 3);
  assert.ok(!JSON.stringify(result.body).includes("test-placeholder"));
  await call(handlers.photos, { ...query, offset: "6", limit: "3" });
  assert.equal(calls.filter(item => item.url.endsWith("places/venue")).length, 2, "photo references are never cached");
  assert.equal((await call(handlers.photos, { ...query, offset: "10" })).code, 400);
});

test("one failed photo leaves the other photos visible; mismatched resources are never fetched", async () => {
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async url => {
    if (url.endsWith("searchText")) return { places: [{ id: "venue", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    if (url.endsWith("places/venue")) return { photos: [{ name: "places/venue/photos/good" }, { name: "places/other/photos/wrong" }, { name: "places/venue/photos/fail" }] };
    if (url.includes("wrong")) assert.fail("another venue's photo must never be fetched");
    if (url.includes("fail")) throw new Error("Temporary upstream failure");
    return { photoUri: "https://images.example.com/good.jpg" };
  } });
  const result = await call(handlers.photos);
  assert.equal(result.body.photos.length, 1);
  assert.equal(result.body.partial, true);
});
