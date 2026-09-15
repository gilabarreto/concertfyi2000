// node --test client/src/helpers/selectors.test.mjs
import { test } from "node:test";
import assert from "node:assert";
import {
  getLastConcertsByArtist,
  getNextConcertsByArtist,
  getBestImage,
} from "./selectors.js";

// Setlist.fm: DD-MM-YYYY
const past = (mbid, eventDate) => ({ id: eventDate, artist: { mbid }, eventDate });

// Ticketmaster: YYYY-MM-DD, e o artista só aparece pelo nome
const upcoming = (name, localDate) => ({
  id: localDate,
  dates: { start: { localDate } },
  _embedded: { attractions: [{ name }] },
});

const MBID = "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d";

test("getLastConcertsByArtist: filtra pelo mbid, descarta futuro e ordena do mais recente", () => {
  const setlist = [
    past(MBID, "01-03-2024"),
    past(MBID, "15-08-2025"),
    past(MBID, "20-12-2099"), // futuro, não pode aparecer
    past("outro-artista", "10-10-2025"),
  ];

  const got = getLastConcertsByArtist(setlist, MBID).map(c => c.id);

  assert.deepStrictEqual(got, ["15-08-2025", "01-03-2024"]);
});

test("getLastConcertsByArtist: lê DD-MM-YYYY, não MM-DD-YYYY", () => {
  // Se o parser trocasse dia e mês, 03-01 viria depois de 01-03.
  const [first] = getLastConcertsByArtist(
    [past(MBID, "01-03-2024"), past(MBID, "03-01-2024")],
    MBID
  );

  assert.strictEqual(first.id, "01-03-2024");
  assert.strictEqual(first.dateObj.getMonth(), 2); // março
});

test("getNextConcertsByArtist: casa pelo nome, ordena do mais próximo e ignora evento sem _embedded", () => {
  const events = [
    upcoming("Radiohead", "2027-05-10"),
    upcoming("Radiohead", "2026-11-02"),
    upcoming("Blur", "2026-10-01"),
    { id: "sem-embedded", dates: { start: { localDate: "2026-12-01" } } },
  ];

  const got = getNextConcertsByArtist(events, "Radiohead").map(e => e.id);

  assert.deepStrictEqual(got, ["2026-11-02", "2027-05-10"]);
});

test("getNextConcertsByArtist: lista vazia quando o nome não bate exatamente", () => {
  const events = [upcoming("Radiohead", "2026-11-02")];

  // O join é por string literal — é a costura frágil do app, não um fuzzy match.
  assert.deepStrictEqual(getNextConcertsByArtist(events, "radiohead"), []);
  assert.deepStrictEqual(getNextConcertsByArtist(undefined, "Radiohead"), []);
});

test("getBestImage: prefere a 16_9 mais larga, senão a de maior área", () => {
  const wide = { ratio: "16_9", width: 1920, height: 1080, url: "wide.jpg" };

  assert.strictEqual(
    getBestImage([
      { ratio: "3_2", width: 4000, height: 2666, url: "huge.jpg" },
      { ratio: "16_9", width: 640, height: 360, url: "small-wide.jpg" },
      wide,
    ]),
    "wide.jpg"
  );

  assert.strictEqual(
    getBestImage([
      { ratio: "3_2", width: 100, height: 100, url: "tiny.jpg" },
      { ratio: "4_3", width: 800, height: 600, url: "big.jpg" },
    ]),
    "big.jpg"
  );

  assert.strictEqual(getBestImage([]), null);
});
