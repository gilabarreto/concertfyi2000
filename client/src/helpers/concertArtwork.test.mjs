import { test } from "node:test";
import assert from "node:assert/strict";
import { artworkQuery, artworkFallbacks } from "./concertArtwork.js";

const concert = {
  eventDate: "04-07-2025",
  artist: { name: "Oasis", mbid: "39ab1aed-75e0-4140-bd47-540276886b60" },
  venue: { name: "Principality Stadium", city: { name: "Cardiff" } },
};
const images = [{ url: "https://s1.ticketm.net/artist.jpg", width: 640 }];
const attraction = { name: "Oasis", images, url: "https://www.ticketmaster.com/artist/1" };
const event = {
  dates: { start: { localDate: "2025-07-04" } },
  _embedded: { attractions: [attraction], venues: [concert.venue] },
  images: [{ url: "https://s1.ticketm.net/event.jpg", width: 640 }],
};

test("artwork lookup preserves the calendar date without timezone conversion", () => {
  assert.equal(artworkQuery(concert).date, "2025-07-04");
  assert.equal(artworkQuery({ ...concert, eventDate: "2025-07-04" }).date, "");
});

test("event artwork requires the same performer, date, venue and city", () => {
  assert.deepEqual(
    artworkFallbacks(concert, { events: [event], attractions: [attraction] }).map(
      (item) => item.kind,
    ),
    ["event-image"],
  );
  for (const changed of [
    { ...event, dates: { start: { localDate: "2026-07-04" } } },
    {
      ...event,
      _embedded: {
        ...event._embedded,
        venues: [{ name: "Other stadium", city: { name: "Cardiff" } }],
      },
    },
    { ...event, _embedded: { ...event._embedded, attractions: [{ name: "Other artist" }] } },
  ]) {
    assert.deepEqual(
      artworkFallbacks(concert, { events: [changed], attractions: [attraction] }).map(
        (item) => item.kind,
      ),
      [],
    );
  }
});

test("does not reuse a different artist or an ambiguous event", () => {
  assert.deepEqual(
    artworkFallbacks(concert, { attractions: [{ ...attraction, name: "Coldplay" }] }),
    [],
  );
  assert.deepEqual(
    artworkFallbacks(concert, { events: [event, event] }).map((item) => item.kind),
    [],
  );
  assert.deepEqual(artworkFallbacks(concert, {}), []);
});

test("does not fall back to the Ticketmaster artist image shown in ArtistInfo", () => {
  assert.deepEqual(artworkFallbacks(concert, { attractions: [attraction] }), []);
});
