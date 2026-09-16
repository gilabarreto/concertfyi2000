// node --test client/src/helpers/calendar.test.mjs
import { test } from "node:test";
import assert from "node:assert";
import { googleCalendarUrl, outlookCalendarUrl, concertIcs, concertIcsUrl } from "./calendar.js";

const now = new Date("2026-09-15T12:00:00Z");

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

test("the show takes the whole day, ending the next one", () => {
  // Google reads the end of an all-day range as exclusive, so a one-night show
  // has to end on the 3rd to sit on the 2nd
  const params = paramsOf(googleCalendarUrl(event({ localDate: "2026-10-02" }), "Nekrogoblikon"));

  assert.equal(params.get("dates"), "20261002/20261003");
  assert.equal(params.get("text"), "Nekrogoblikon at Ace of Spades");
  assert.equal(params.get("location"), "Ace of Spades, Sacramento, CA");
  assert.equal(params.get("action"), "TEMPLATE");
});

test("a start time does not turn the entry back into a timed block", () => {
  const params = paramsOf(
    googleCalendarUrl(
      event({ localDate: "2026-10-02", dateTime: "2026-10-03T02:00:00Z" }),
      "Nekrogoblikon",
    ),
  );

  // the UTC time sits on the 3rd, so honouring it would move the show off its day
  assert.equal(params.get("dates"), "20261002/20261003");
});

test("spaces and commas survive as encoded query values", () => {
  const url = googleCalendarUrl(event({ localDate: "2026-10-02" }), "Godspeed You! Black Emperor");

  assert.ok(!url.includes(" "), "a raw space would truncate the link");
  assert.equal(paramsOf(url).get("text"), "Godspeed You! Black Emperor at Ace of Spades");
});

test("no date means no link rather than an entry on the wrong day", () => {
  for (const target of [googleCalendarUrl, outlookCalendarUrl, concertIcs, concertIcsUrl]) {
    assert.equal(target(event({}), "Nekrogoblikon"), null, target.name);
    assert.equal(target({}, "Nekrogoblikon"), null, target.name);
  }
});

test("outlook gets the same day, flagged all day", () => {
  const params = paramsOf(outlookCalendarUrl(event({ localDate: "2026-10-02" }), "Nekrogoblikon"));

  assert.equal(params.get("startdt"), "2026-10-02");
  assert.equal(params.get("enddt"), "2026-10-03");
  assert.equal(params.get("allday"), "true");
  assert.equal(params.get("subject"), "Nekrogoblikon at Ace of Spades");
  assert.equal(params.get("rru"), "addevent");
});

test("the ics carries the show as a date, with both alarms", () => {
  const ics = concertIcs(event({ localDate: "2026-10-02" }), "Nekrogoblikon", { now });

  assert.match(ics, /^DTSTART;VALUE=DATE:20261002$/m);
  assert.match(ics, /^DTEND;VALUE=DATE:20261003$/m);
  assert.match(ics, /^UID:G5vYZbMN2qDpw@concertfyi\.com$/m);
  assert.match(ics, /^SUMMARY:Nekrogoblikon at Ace of Spades$/m);
  assert.match(ics, /^TRIGGER:-P1D$/m);
  // midnight start, so the day-of alarm counts forward instead of back
  assert.match(ics, /^TRIGGER:PT9H$/m);
  assert.ok(ics.endsWith("END:VCALENDAR"));
});

test("a comma in the venue is escaped, not left to split the line", () => {
  const ics = concertIcs(event({ localDate: "2026-10-02" }), "Godspeed You! Black Emperor", {
    now,
  });

  assert.match(ics, /^LOCATION:Ace of Spades\\, Sacramento\\, CA$/m);
});

test("the download url is a calendar file the browser can save", () => {
  const url = concertIcsUrl(event({ localDate: "2026-10-02" }), "Nekrogoblikon");

  const prefix = "data:text/calendar;charset=utf-8,";

  assert.ok(url.startsWith(prefix));
  assert.ok(!url.includes(" "), "a raw space would truncate the href");
  assert.match(decodeURIComponent(url.slice(prefix.length)), /^BEGIN:VCALENDAR/);
});
