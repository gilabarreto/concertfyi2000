import { test } from "node:test";
import assert from "node:assert/strict";
import { getArtistOverviewTarget, getConcertTarget } from "./concertTarget.js";
const show = (id, name, mbid = "artist") => ({
  id,
  artist: { name, mbid },
  eventDate: "01-01-2020",
});

test("View concert selects the exact artist instead of the first name-search result", () => {
  const target = getConcertTarget(
    [show("wrong", "Foo Fighters Tribute", "tribute"), show("right", "Foo Fighters")],
    "Foo Fighters",
    "event-42",
  );
  assert.equal(target.pathname, "/artists/artist/concerts/right");
  assert.equal(new URLSearchParams(target.search).get("next"), "event-42");
});
test("ambiguous artist names and artists without setlists have no fabricated target", () => {
  assert.equal(getConcertTarget([], "Foo Fighters", "event"), null);
  assert.equal(
    getConcertTarget(
      [show("a", "Foo Fighters"), show("b", "Foo Fighters", "other")],
      "Foo Fighters",
      "event",
    ),
    null,
  );
});
test("matching accepts punctuation and accent differences and preserves event IDs", () => {
  const target = getConcertTarget([show("last", "W.A.S.P.")], "WASP", "event&42");
  assert.equal(new URLSearchParams(target.search).get("next"), "event&42");
});

test("artist-only targets preserve Ticketmaster identity, artist name and selected event without a concert ID", () => {
  const target = getArtistOverviewTarget("tm/42", "Earth, Wind & Fire", "event&42");
  assert.equal(target.pathname, "/artists/ticketmaster/tm%2F42");
  const params = new URLSearchParams(target.search);
  assert.equal(params.get("name"), "Earth, Wind & Fire");
  assert.equal(params.get("next"), "event&42");
  assert.equal(getArtistOverviewTarget(null, "Artist"), null);
  assert.equal(getArtistOverviewTarget("tm", ""), null);
});
