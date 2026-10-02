// node --test client/src/helpers/tourStats.test.mjs

// Fuso fixo antes de qualquer Date, pelo mesmo motivo do selectors.test.mjs.
process.env.TZ = "America/Sao_Paulo";

import { test } from "node:test";
import assert from "node:assert";
import { getTourMapData, findTourUpcomingEvent, getTourUpcomingConcerts } from "./tourStats.js";

test("tour map counts dates without coordinates and excludes unrelated tours and artists", () => {
  const entry = (date, coords, artist = "artist", tour = "Tour") => ({
    eventDate: date,
    artist: { mbid: artist },
    tour: { name: tour },
    venue: { city: { name: "City", coords } },
  });
  const result = getTourMapData(
    [
      entry("30-09-2026", { lat: 0, long: 0 }),
      entry("01-10-2026"),
      entry("02-10-2026", { lat: 999, long: 12 }),
      entry("03-10-2026", { lat: 10, long: 20 }, "other"),
      entry("04-10-2026", { lat: 10, long: 20 }, "artist", "Other Tour"),
    ],
    "artist",
    "Tour",
    new Date(2026, 9, 1, 18),
  );
  assert.equal(result.past, 1);
  assert.equal(result.upcoming, 2);
  assert.equal(result.points.length, 1);
  assert.equal(result.points[0].upcoming, false);
  assert.equal(result.shows[0].date.getDate(), 30);
  assert.equal(result.shows.at(-1).date.getDate(), 2);
  const empty = getTourMapData([], "artist", "Tour");
  assert.equal(empty.past, 0);
  assert.equal(empty.upcoming, 0);
  assert.deepEqual(empty.points, []);
});

test("future tour markers prefer exact venues and reject ambiguous dates and unrelated locations", () => {
  const show = {
    id: "setlist-id",
    eventDate: "03-10-2026",
    artist: { name: "Artist" },
    venue: { name: "Venue", city: { name: "São Paulo" } },
  };
  const event = {
    id: "ticketmaster-id",
    dates: { start: { localDate: "2026-10-03" } },
    _embedded: {
      attractions: [{ name: "Artist" }],
      venues: [{ name: "Venue", city: { name: "Sao Paulo" } }],
    },
  };
  assert.equal(findTourUpcomingEvent(show, [event])?.id, "ticketmaster-id");
  assert.equal(findTourUpcomingEvent(show, []), null);
  assert.equal(findTourUpcomingEvent(show, [event, { ...event, id: "other-event" }]), null);
  assert.equal(
    findTourUpcomingEvent(show, [{ ...event, dates: { start: { localDate: "2026-10-04" } } }]),
    null,
  );
  assert.equal(
    findTourUpcomingEvent(show, [
      { ...event, _embedded: { ...event._embedded, attractions: [{ name: "Other artist" }] } },
    ]),
    null,
  );
  assert.equal(
    findTourUpcomingEvent(show, [
      {
        ...event,
        _embedded: {
          ...event._embedded,
          venues: [{ name: "Other venue", city: { name: "Other city" } }],
        },
      },
    ]),
    null,
  );
});

test("tour markers tolerate venue sponsorship and municipal names while preserving country and uniqueness", () => {
  const show = {
    eventDate: "03-10-2026",
    artist: { name: "aespa" },
    venue: {
      name: "Arena",
      city: { name: "City", country: { code: "US" }, coords: { lat: 34, long: -118 } },
    },
  };
  const event = {
    id: "event",
    dates: { start: { localDate: "2026-10-03" } },
    _embedded: {
      attractions: [{ name: "aespa" }],
      venues: [{ name: "Sponsor Arena", city: { name: "City" }, country: { countryCode: "US" } }],
    },
  };
  assert.equal(findTourUpcomingEvent(show, [event])?.id, "event");
  assert.equal(findTourUpcomingEvent(show, [event, { ...event, id: "second" }]), null);
  const municipal = {
    ...event,
    _embedded: {
      ...event._embedded,
      venues: [
        {
          name: "Sponsor Arena",
          city: { name: "Neighbor" },
          country: { countryCode: "US" },
          location: { latitude: "34.01", longitude: "-118.01" },
        },
      ],
    },
  };
  assert.equal(findTourUpcomingEvent(show, [municipal])?.id, "event");
  const far = {
    ...municipal,
    _embedded: {
      ...municipal._embedded,
      venues: [
        { ...municipal._embedded.venues[0], location: { latitude: "40", longitude: "-90" } },
      ],
    },
  };
  assert.equal(findTourUpcomingEvent(show, [far]), null);
  const differentCountry = {
    ...event,
    _embedded: {
      ...event._embedded,
      venues: [{ ...event._embedded.venues[0], country: { countryCode: "CA" } }],
    },
  };
  assert.equal(findTourUpcomingEvent(show, [differentCountry]), null);
  const exact = {
    ...event,
    id: "exact",
    _embedded: { ...event._embedded, venues: [{ ...event._embedded.venues[0], name: "Arena" }] },
  };
  assert.equal(findTourUpcomingEvent(show, [event, exact])?.id, "exact");
});

test("WASP future shows match New York City and renamed Wallingford venue", () => {
  const artist = { name: "W.A.S.P." };
  const makeEvent = (id, date, name, city) => ({
    id,
    dates: { start: { localDate: date } },
    _embedded: {
      attractions: [artist],
      venues: [{ name, city: { name: city }, country: { countryCode: "US" } }],
    },
  });
  const events = [
    makeEvent("ny", "2026-10-02", "Palladium Times Square ", "New York City"),
    makeEvent("ct", "2026-10-01", "Toyota Oakdale Theatre", "Wallingford"),
  ];
  const ny = {
    eventDate: "02-10-2026",
    artist,
    venue: { name: "Palladium Times Square", city: { name: "New York", country: { code: "US" } } },
  };
  const ct = {
    eventDate: "01-10-2026",
    artist,
    venue: { name: "The Dome", city: { name: "Wallingford", country: { code: "US" } } },
  };
  assert.equal(findTourUpcomingEvent(ny, events)?.id, "ny");
  assert.equal(findTourUpcomingEvent(ct, events)?.id, "ct");
  const map = getTourMapData(
    [{ ...ny, artist: { ...artist, mbid: "wasp" }, tour: { name: "1984 To Headless" } }],
    "wasp",
    "1984 to Headless",
    new Date(2026, 9, 1),
  );
  assert.equal(map.upcoming, 1);
});

test("selected tour date remains available without a ticket vendor listing", () => {
  const future = {
    id: "carteret",
    eventDate: "03-10-2099",
    artist: { name: "W.A.S.P." },
    tour: { name: "1984 To Headless" },
    url: "https://www.setlist.fm/setlist/example",
    venue: {
      name: "Carteret Performing Arts & Events Center",
      city: { name: "Carteret", country: { code: "US" }, coords: { lat: 40.58, long: -74.23 } },
    },
  };
  const [event] = getTourUpcomingConcerts([], "W.A.S.P.", [future], "setlist:carteret");
  assert.equal(event.source, "setlistfm");
  assert.equal(event.dates.start.localDate, "2099-10-03");
  assert.equal(event._embedded.venues[0].city.name, "Carteret");
  assert.equal(event.tourName, future.tour.name);
  assert.equal(event.dates.start.localTime, undefined);
  assert.deepEqual(getTourUpcomingConcerts([], "Other artist", [future], "setlist:carteret"), []);
  assert.deepEqual(
    getTourUpcomingConcerts(
      [],
      "W.A.S.P.",
      [{ ...future, eventDate: "03-10-2000" }],
      "setlist:carteret",
    ),
    [],
  );
  assert.deepEqual(getTourUpcomingConcerts([], "W.A.S.P.", [future], null), []);
});
