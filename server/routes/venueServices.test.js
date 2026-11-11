const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createVenueServicesHandlers } = require("./venueServices");
// `google: "true"` is the visitor's click; most tests exercise the Google side.
const query = { name: "Wembley Stadium", lat: "51.556", long: "-0.279", exact: "true", google: "true" };
const osmVenue = { type: "way", id: 1, center: { lat: 51.556, lon: -0.279 }, tags: { name: query.name, wheelchair: "yes", phone: "+44 1234", opening_hours: "Mo-Fr 09:00-17:00", website: "https://www.wembleystadium.com", "payment:cash": "no" } };
// Nominatim's answer for OSM elements written as raw tags: name apart, the rest as extratags.
const nominatim = elements => elements.map(({ type, id, lat, lon, center, tags: { name, ...extratags } }) => ({ osm_type: type, osm_id: id, lat: String(lat ?? center.lat), lon: String(lon ?? center.lon), name, extratags }));
async function call(handler, input = query) {
  const res = { code: 200, headers: {}, status(code) { this.code = code; return this; }, set(key, value) { this.headers[key] = value; return this; }, json(body) { this.body = body; return this; } };
  await handler({ query: input }, res);
  return res;
}

test("OSM works without a Google key, preserves negative values and caches only free content", async () => {
  let requests = 0;
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => { requests++; return nominatim([osmVenue]); } });
  const first = await call(handlers.services);
  assert.equal(first.body.fields.phone.value, "+44 1234");
  assert.equal(first.body.fields.payments.value, "cash: no");
  assert.equal(first.body.fields.phone.source, "OpenStreetMap");
  assert.equal(first.headers["Cache-Control"], "no-store");
  await call(handlers.services);
  assert.equal(requests, 1);
  assert.deepEqual(first.body.reviews, [], "reviews come only from Google");
  assert.equal(first.body.providers.google, "unconfigured");
});

test("OSM accepts an added word only for a single place tagged as a venue", async () => {
  const roadhouse = { ...osmVenue, tags: { name: "The Big Four Roadhouse", amenity: "events_venue", website: "https://bigfour.example" } };
  const answer = elements => createVenueServicesHandlers({ apiKey: "", fetchJson: async () => nominatim(elements) });
  const big = { ...query, name: "Big Four Roadhouse" };
  assert.equal((await call(answer([roadhouse]).services, big)).body.fields.website.value, "https://bigfour.example");
  // Not a venue tag (a shop, a road): no.
  assert.equal((await call(answer([{ ...roadhouse, tags: { ...roadhouse.tags, amenity: "restaurant" } }]).services, big)).body.fields.website, null);
  // Two candidates: ambiguous, no.
  assert.equal((await call(answer([roadhouse, { ...roadhouse, id: 2, center: { lat: 51.5565, lon: -0.2795 } }]).services, big)).body.fields.website, null);
});

test("a Nominatim address without a house number is the nearest road, so it is dropped", async () => {
  const place = nominatim([osmVenue])[0];
  const answer = address => createVenueServicesHandlers({ apiKey: "", fetchJson: async () => [{ ...place, address }] });
  assert.equal((await call(answer({ road: "Zig-a-Zag Allée Footpath", country: "United Kingdom" }).services)).body.fields.address, null);
  assert.equal((await call(answer({ house_number: "1", road: "Olympic Way", city: "London", country: "United Kingdom" }).services)).body.fields.address.value, "1 Olympic Way, London, United Kingdom");
});

test("matching rejects namesakes, ambiguity and a failed Nominatim answer", async () => {
  for (const elements of [[{ ...osmVenue, center: { lat: 0, lon: 0 } }], [osmVenue, { ...osmVenue, id: 2, center: { lat: 51.56, lon: -0.279 } }], [{ ...osmVenue, tags: { name: "Wrong Stadium" } }]]) {
    const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => (nominatim(elements)) });
    assert.equal((await call(handlers.services)).body.fields.phone, null);
  }
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => ({ error: "Nominatim is overloaded" }) });
  assert.equal((await call(handlers.services)).body.partial, true);
});

test("the area and its nearby label node do not make one OSM venue ambiguous", async () => {
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => (nominatim([osmVenue, { ...osmVenue, type: "node", lat: 51.556, lon: -0.279 }])) });
  assert.equal((await call(handlers.services)).body.fields.phone.value, "+44 1234");
});

test("Google complements use explicit masks, fallback per missing field and never cache content", async () => {
  const requests = [];
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith("searchText")) return { places: [{ id: "test_place", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    if (url.includes("places/test_place")) return { internationalPhoneNumber: "+44 5678", accessibilityOptions: { wheelchairAccessibleEntrance: false }, paymentOptions: { acceptsCashOnly: false }, googleMapsUri: "https://maps.google.com/?cid=1" };
    return nominatim([osmVenue]);
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
  assert.ok(details[0].options.headers["X-Goog-FieldMask"].includes("reviews"), "reviews share the one billed details call");
  assert.equal(details[0].options.headers["X-Goog-Api-Key"], "test-placeholder");
  assert.ok(requests.every(item => !item.url.includes("test-placeholder")));
});

test("reviews ride on the services call, capped at five, preserving author/source attribution", async () => {
  const masks = [];
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    if (url.endsWith("searchText")) return { places: [{ id: "test_place", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    if (!url.includes("places.googleapis.com")) return nominatim([]);
    masks.push(options.headers["X-Goog-FieldMask"]);
    return { rating: 4.5, userRatingCount: 100, location: { latitude: 51.5561, longitude: -0.2796 }, googleMapsUri: "https://maps.google.com/?cid=1", reviews: Array.from({ length: 6 }, () => ({ rating: 5, text: { text: "A review" }, authorAttribution: { displayName: "Author", uri: "https://maps.google.com/user", photoUri: "https://example.com/photo" } })) };
  } });
  const result = await call(handlers.services);
  assert.equal(result.body.reviews.length, 5);
  assert.equal(result.body.reviews[0].author, "Author");
  assert.equal(result.body.fields.rating.value, 4.5);
  assert.equal(masks.length, 1, "one details call per venue");
  assert.ok(masks[0].split(",").includes("reviews"));
  assert.deepEqual(result.body.location, { lat: 51.5561, long: -0.2796 }, "the building's pin, for the map");
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
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => (nominatim([station, osmVenue])) });
  const body = (await call(handlers.services)).body;
  assert.equal(body.fields.phone.value, "+44 1234");
  assert.ok(body.location, "OSM's pin when Google has none");
  const stationOnly = createVenueServicesHandlers({ apiKey: "", fetchJson: async () => (nominatim([station])) });
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
      return nominatim([osmVenue]);
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
    return nominatim([]);
  } });
  const result = await call(handlers.services, { name: "Dicken's Pub", lat: "51.05", long: "-114.085", google: "true" });
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
  const queries = [];
  const handlers = createVenueServicesHandlers({ apiKey: "", fetchJson: async (_url, options) => {
    queries.push(options.params.q);
    // OSM spells it "Dickens": the name with the apostrophe finds nothing.
    return options.params.q.includes("'") ? [] : nominatim([{ ...osmVenue, tags: { name: "Dickens", amenity: "pub", "description:en": "An independent live music pub." } }]);
  } });
  const result = await call(handlers.services, { ...query, name: "Dicken's Pub" });
  assert.equal(result.body.fields.description.value, "An independent live music pub.");
  assert.deepEqual(queries, ["Dicken's Pub", "Dickens Pub"], "bare words only after a miss");

  // OSM spells "Vern's" with it: found on the first search, no second call.
  queries.length = 0;
  const verns = createVenueServicesHandlers({ apiKey: "", fetchJson: async (_url, options) => {
    queries.push(options.params.q);
    return nominatim([{ ...osmVenue, tags: { name: "Vern's", amenity: "bar", phone: "+1 403" } }]);
  } });
  assert.equal((await call(verns.services, { ...query, name: "Vern's" })).body.fields.phone.value, "+1 403");
  assert.deepEqual(queries, ["Vern's"]);
});

test("profile rating uses Google's aggregate and count from the same details call as reviews", async () => {
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
    if (url.endsWith("searchText")) return { places: [{ id: "venue", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 } }] };
    if (url.includes("places/venue")) {
      const mask = options.headers["X-Goog-FieldMask"].split(",");
      assert.ok(mask.includes("rating"));
      assert.ok(mask.includes("userRatingCount"));
      assert.ok(mask.includes("reviews"));
      return { rating: 4.6, userRatingCount: 1438, googleMapsUri: "https://maps.google.com/?cid=1" };
    }
    return nominatim([]);
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
      assert.equal(options.headers["X-Goog-FieldMask"], "photos,attributions", "IDs Only: the photo list is unbilled");
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
  const before = calls.filter(item => item.url.endsWith("/media")).length;
  const thumbnail = await call(handlers.photos, { ...query, offset: "0", limit: "1" });
  assert.equal(thumbnail.body.photos.length, 1);
  assert.equal(calls.filter(item => item.url.endsWith("/media")).length - before, 1, "Home fetches only one image per venue");
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

test("with an exact pin, Google's top venue-typed result stands in for a renamed venue; never with city coordinates", async () => {
  const run = async (input, places) => {
    const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async url => {
      if (url.endsWith("searchText")) return { places };
      if (url.includes("places.googleapis.com")) return { internationalPhoneNumber: "+55 11 0000", googleMapsUri: "https://maps.google.com/?cid=1" };
      return nominatim([]);
    } });
    return (await call(handlers.services, input)).body;
  };
  // A sponsor rename shares no words with the old name: only the exact pin can vouch for it.
  const arena = { id: "renamed", displayName: { text: "Vibra São Paulo" }, types: ["event_venue"], location: { latitude: 51.556, longitude: -0.279 } };
  const cafe = { ...arena, id: "cafe", displayName: { text: "Café do Centro" }, types: ["cafe"] };
  const named = { ...query, name: "Credicard Hall" };
  assert.equal((await run(named, [arena])).providers.google, "ok");
  assert.equal((await run({ ...named, exact: "false" }, [arena])).providers.google, "not-found", "city coordinates are too loose to trust a different name");
  assert.equal((await run(named, [cafe, arena])).providers.google, "not-found", "only Google's top result may stand in");
  assert.equal((await run(named, [cafe])).providers.google, "not-found", "a non-venue type never stands in");
});

test("automatic matching: added/dropped words need a venue type, and a miss retries with the city", async () => {
  const run = async (input, answer) => {
    const queries = [];
    const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", fetchJson: async (url, options) => {
      if (url.endsWith("searchText")) { const { textQuery } = JSON.parse(options.body); queries.push(textQuery); return { places: answer(textQuery) }; }
      if (url.includes("places.googleapis.com")) return { internationalPhoneNumber: "+55 11 0000", googleMapsUri: "https://maps.google.com/?cid=1" };
      return nominatim([]);
    } });
    return { body: (await call(handlers.services, input)).body, queries };
  };
  const at = { latitude: 51.556, longitude: -0.279 };
  const loose = { ...query, exact: "false" };
  const suffixed = { id: "suffixed", displayName: { text: "Espaço Unimed - Arena" }, types: ["event_venue"], location: at };
  assert.equal((await run({ ...loose, name: "Espaço Unimed" }, () => [suffixed])).body.providers.google, "ok", "added words, even with city coordinates");
  assert.equal((await run({ ...loose, name: "Allianz Parque Arena" }, () => [{ ...suffixed, displayName: { text: "Allianz Parque" } }])).body.providers.google, "ok", "dropped words");
  assert.equal((await run({ ...loose, name: "Espaço Unimed" }, () => [{ ...suffixed, types: ["parking"] }])).body.providers.google, "not-found", "never a non-venue");
  assert.equal((await run({ ...loose, name: "Espaço Unimed" }, () => [suffixed, { ...suffixed, id: "twin" }])).body.providers.google, "not-found", "never ambiguous");
  assert.equal((await run({ ...loose, name: "Madison Square Garden" }, () => [{ ...suffixed, displayName: { text: "Madison" } }])).body.providers.google, "not-found", "too short to stand for the whole name");
  assert.equal((await run({ ...loose, name: "Commonwealth Bar & Stage" }, () => [{ ...suffixed, displayName: { text: "Commonwealth" } }])).body.providers.google, "ok", "generic words dropped");
  assert.equal((await run({ ...loose, name: "King’s Head Pub" }, () => [{ ...suffixed, displayName: { text: "The King's Head Eatery & Music Room" } }])).body.providers.google, "ok", "generic words added");
  assert.equal((await run({ ...loose, name: "Cafe Theatre" }, () => [{ ...suffixed, displayName: { text: "Café Théâtre | French Restaurant Calgary" }, types: ["restaurant"] }])).body.providers.google, "ok", "tagline after the bar");
  const flats = { ...suffixed, id: "flats", displayName: { text: "The Palomino" }, types: ["lodging"] };
  const smokehouse = { ...suffixed, id: "smokehouse", displayName: { text: "Palomino Smokehouse" }, types: ["bar", "live_music_venue"] };
  assert.equal((await run({ ...loose, name: "The Palomino" }, () => [smokehouse, flats])).body.providers.google, "ok", "never a same-named apartment block");
  assert.equal((await run({ ...loose, name: "The Palomino" }, () => [flats])).body.providers.google, "not-found");

  const retried = await run({ ...loose, name: "Espaço Unimed", city: "São Paulo" }, textQuery => textQuery.includes("São Paulo") ? [suffixed] : []);
  assert.equal(retried.body.providers.google, "ok");
  assert.deepEqual(retried.queries, ["Espaço Unimed", "Espaço Unimed, São Paulo"]);
  const firstHit = await run({ ...loose, name: "Espaço Unimed", city: "São Paulo" }, () => [suffixed]);
  assert.equal(firstHit.queries.length, 1, "the city search is spent only on a miss");
  assert.equal((await run({ ...loose, city: ["x"] }, () => [])).body.error, "Invalid city");
});

test("opening the page spends nothing on Google; the rating click spends one GetPlace and no media", async () => {
  const calls = [];
  const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", osmUrl: "https://osm.example/search", fetchJson: async (url, options) => {
    calls.push(url);
    if (url.startsWith("https://osm.example")) return nominatim([osmVenue]);
    if (url.endsWith("searchText")) return { places: [{ id: "venue", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 }, types: ["stadium"] }] };
    assert.doesNotMatch(options.headers["X-Goog-FieldMask"], /photos/, "photos are their own click");
    return { googleMapsUri: "https://maps.google.com/?cid=1", rating: 4.5, photos: [{ name: "places/venue/photos/a" }] };
  } });

  const opened = await call(handlers.services, { ...query, google: undefined });
  assert.equal(calls.filter(url => url.includes("googleapis")).length, 0);
  assert.equal(opened.body.providers.google, "skipped");
  assert.equal(opened.body.fields.phone.source, "OpenStreetMap");

  const clicked = await call(handlers.services);
  assert.equal(clicked.body.fields.rating.value, 4.5);
  assert.equal(calls.filter(url => url.endsWith("places/venue")).length, 1);
  assert.equal(calls.filter(url => url.endsWith("/media")).length, 0);
  assert.equal(clicked.body.photos, undefined);
});

test("stored venue: second visit spends no search and no Nominatim, only the live details call", async () => {
  const { createStore } = require("../store");
  const rows = new Map();
  // D1 de mentira compartilhado entre dois handlers = dois isolates do Worker.
  const db = { prepare: sql => ({ bind: (...args) => ({
    first: async () => rows.get(args[0]) || null,
    run: async () => void rows.set(args[0], { value: args[1], expires_at: args[2] }),
  }) }) };
  const counts = {};
  const fetchJson = async (url) => {
    const kind = url.includes("osm.example") ? "osm" : url.endsWith("searchText") ? "search" : url.endsWith("/media") ? "media" : "details";
    counts[kind] = (counts[kind] || 0) + 1;
    if (kind === "osm") return nominatim([osmVenue]);
    if (kind === "search") return { places: [{ id: "venue", displayName: { text: query.name }, location: { latitude: 51.556, longitude: -0.279 }, types: ["stadium"] }] };
    return { googleMapsUri: "https://maps.google.com/?cid=1", rating: 4.5, userRatingCount: 10 };
  };
  const app = { locals: { store: createStore({ db }) } };
  const visit = async () => {
    const handlers = createVenueServicesHandlers({ apiKey: "test-placeholder", osmUrl: "https://osm.example/search", fetchJson });
    const res = { code: 200, headers: {}, status(code) { this.code = code; return this; }, set(k, v) { this.headers[k] = v; return this; }, json(body) { this.body = body; return this; } };
    await handlers.services({ query, app }, res);
    return res.body;
  };

  await visit();
  const first = { ...counts };
  const second = await visit();
  assert.equal(second.fields.rating.value, 4.5);
  assert.equal(counts.search, first.search, "no new SearchText");
  assert.equal(counts.osm, first.osm, "no new Nominatim");
  assert.equal(counts.details - first.details, 1, "details stay live: one GetPlace per visit");
  const stored = [...rows.entries()].filter(([key]) => key.startsWith("google-id:"));
  assert.deepEqual(stored.map(([, row]) => row.value), ['"venue"'], "only the place ID is kept from Google");
});
