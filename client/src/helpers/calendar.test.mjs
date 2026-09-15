// node --test client/src/helpers/calendar.test.mjs
import { test } from "node:test";
import assert from "node:assert";
import { concertIcs } from "./calendar.js";

const now = new Date("2026-09-15T12:00:00Z");

const event = (start) => ({
  id: "G5vYZbMN2qDpw",
  url: "https://www.ticketmaster.com/event/G5vYZbMN2qDpw",
  dates: { start },
  _embedded: {
    venues: [
      {
        name: "Ace of Spades",
        city: { name: "Sacramento" },
        state: { stateCode: "CA" },
      },
    ],
  },
});

test("a timed show becomes a UTC entry that ends the same night", () => {
  const ics = concertIcs(
    event({ localDate: "2026-10-02", dateTime: "2026-10-03T02:00:00Z" }),
    "Nekrogoblikon",
    { now }
  );

  assert.match(ics, /^DTSTART:20261003T020000Z$/m);
  assert.match(ics, /^DTEND:20261003T050000Z$/m);
  assert.match(ics, /^UID:G5vYZbMN2qDpw@concertfyi\.com$/m);
  assert.match(ics, /^SUMMARY:Nekrogoblikon at Ace of Spades$/m);
  assert.match(ics, /^TRIGGER:-P1D$/m);
  assert.ok(ics.endsWith("END:VCALENDAR"));
});

test("a show with no time is all day and ends the next day", () => {
  const ics = concertIcs(event({ localDate: "2026-10-02" }), "Nekrogoblikon", { now });

  assert.match(ics, /^DTSTART;VALUE=DATE:20261002$/m);
  assert.match(ics, /^DTEND;VALUE=DATE:20261003$/m);
});

test("commas and semicolons in a venue name stay escaped", () => {
  const venue = event({ localDate: "2026-10-02" });
  venue._embedded.venues[0].name = "Bob's Bar, Grill; Co";

  const ics = concertIcs(venue, "Nekrogoblikon", { now });

  assert.match(ics, /^LOCATION:Bob's Bar\\, Grill\\; Co\\, Sacramento\\, CA$/m);
});

test("every line is CRLF terminated, as readers require", () => {
  const ics = concertIcs(event({ localDate: "2026-10-02" }), "Nekrogoblikon", { now });

  assert.equal(ics.split("\r\n").length, ics.split("\n").length);
});

test("no date means no entry rather than one on the wrong day", () => {
  assert.equal(concertIcs(event({}), "Nekrogoblikon", { now }), null);
  assert.equal(concertIcs({}, "Nekrogoblikon", { now }), null);
});
