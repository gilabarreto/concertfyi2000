// node --test client/src/helpers/calendar.test.mjs
import { test } from "node:test";
import assert from "node:assert";
import { googleCalendarUrl } from "./calendar.js";

const event = (start) => ({
  id: "G5vYZbMN2qDpw",
  url: "https://on.fgtix.com/trk/g3Nfc",
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

const paramsOf = (url) => new URL(url).searchParams;

test("a timed show spans the evening in UTC", () => {
  const params = paramsOf(
    googleCalendarUrl(event({ localDate: "2026-10-02", dateTime: "2026-10-03T02:00:00Z" }), "Nekrogoblikon")
  );

  assert.equal(params.get("dates"), "20261003T020000Z/20261003T050000Z");
  assert.equal(params.get("text"), "Nekrogoblikon at Ace of Spades");
  assert.equal(params.get("location"), "Ace of Spades, Sacramento, CA");
  assert.equal(params.get("action"), "TEMPLATE");
});

test("a show with no time is all day, ending the next day", () => {
  // Google reads the end of an all-day range as exclusive, so a one-night show
  // has to end on the 3rd to sit on the 2nd
  const params = paramsOf(googleCalendarUrl(event({ localDate: "2026-10-02" }), "Nekrogoblikon"));

  assert.equal(params.get("dates"), "20261002/20261003");
});

test("spaces and commas survive as encoded query values", () => {
  const url = googleCalendarUrl(event({ localDate: "2026-10-02" }), "Godspeed You! Black Emperor");

  assert.ok(!url.includes(" "), "a raw space would truncate the link");
  assert.equal(paramsOf(url).get("text"), "Godspeed You! Black Emperor at Ace of Spades");
});

test("no date means no link rather than an entry on the wrong day", () => {
  assert.equal(googleCalendarUrl(event({}), "Nekrogoblikon"), null);
  assert.equal(googleCalendarUrl({}, "Nekrogoblikon"), null);
});
