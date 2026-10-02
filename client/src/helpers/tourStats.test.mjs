// node --test client/src/helpers/tourStats.test.mjs

// Fuso fixo antes de qualquer Date, pelo mesmo motivo do selectors.test.mjs.
process.env.TZ = "America/Sao_Paulo";

import { test } from "node:test";
import assert from "node:assert";
import { getTourStats } from "./tourStats.js";

const show = (eventDate, songs, country = "US", cityId = eventDate) => ({
  eventDate,
  venue: { city: { id: cityId, country: { code: country } } },
  sets: { set: [{ song: songs.map((name) => (typeof name === "string" ? { name } : name)) }] },
});

test("conta só o passado, ignora tape e devolve null onde não há dado", () => {
  const now = new Date(2026, 9, 1);
  const stats = getTourStats(
    [
      show("10-08-2026", [{ name: "Intro", tape: true }, "All My Life", "My Hero", "Everlong"]),
      show("12-08-2026", ["All My Life", "Rope", "Everlong"], "CA"),
      show("05-09-2026", [], "CA"), // passado, mas sem setlist ainda
      show("03-10-2026", []), // futuro
    ],
    now,
  );

  assert.strictEqual(stats.shows, 3);
  assert.strictEqual(stats.upcoming, 1);
  assert.strictEqual(stats.countries, 2);
  assert.strictEqual(stats.withSongs, 2);
  assert.strictEqual(stats.avgSongs, 3);
  assert.deepStrictEqual(stats.opener, { name: "All My Life", count: 2 });
  assert.deepStrictEqual(stats.closer, { name: "Everlong", count: 2 });
  assert.strictEqual(stats.rarities, 2); // My Hero, Rope
  assert.strictEqual(stats.firstDate.getDate(), 10);
  assert.strictEqual(stats.lastDate.getMonth(), 9);

  const empty = getTourStats([], now);
  assert.strictEqual(empty.shows, null);
  assert.strictEqual(empty.mostPlayed, null);
  assert.strictEqual(empty.firstDate, null);
});
