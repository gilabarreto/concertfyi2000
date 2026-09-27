import { test } from "node:test";
import assert from "node:assert/strict";
import { getNearbyConcert } from "./nearbyConcert.js";

const origin = { lat: 51.0447, long: -114.0719 };
const show = (id, latitude, date = "2099-10-01", artist = "Artist", status = "onsale") => ({
  id,
  dates: { start: { localDate: date }, status: { code: status } },
  _embedded: {
    attractions: [{ name: artist }],
    venues: [{ location: { latitude, longitude: -114.0719 } }],
  },
});

test("nearby concert picks the earliest matching show within 50 km", () => {
  const events = [
    show("later", 51.0447, "2099-11-01"),
    show("far", 52),
    show("other artist", 51, "2099-10-01", "Other"),
    show("nearby", 51.3),
    show("past", 51, "2000-01-01"),
    show("cancelled", 51, "2099-09-01", "Artist", "cancelled"),
  ];
  assert.equal(getNearbyConcert(events, "Artist", origin)?.id, "nearby");
});

test("nearby concert excludes unknown locations and events beyond the radius", () => {
  assert.equal(getNearbyConcert([show("far", 51.5)], "Artist", origin), null);
  assert.equal(getNearbyConcert([show("unknown", null)], "Artist", origin), null);
  assert.equal(getNearbyConcert([show("local", 51)], "Artist", null), null);
  assert.equal(getNearbyConcert([show("local", 51)], "Artist", { lat: "", long: 0 }), null);
  assert.equal(getNearbyConcert([], "Artist", origin), null);
});

test("nearby concert accepts numeric strings and includes the same city", () => {
  assert.equal(getNearbyConcert([show("local", "51.0447")], "Artist", origin)?.id, "local");
});
