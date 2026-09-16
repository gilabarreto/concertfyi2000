// node --test client/src/helpers/selectors.test.mjs

// Fuso fixo antes de qualquer Date. O CI roda em UTC, onde o bug de parse que o
// último teste deste arquivo cobre é invisível — e um teste que só passa por causa
// do fuso da máquina não está testando nada.
process.env.TZ = "America/Sao_Paulo";

import { test } from "node:test";
import assert from "node:assert";
import {
  getLastConcertsByArtist,
  getNextConcertsByArtist,
  getBestImage,
  parseSetlistDate,
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

  const got = getLastConcertsByArtist(setlist, MBID).map((c) => c.id);

  assert.deepStrictEqual(got, ["15-08-2025", "01-03-2024"]);
});

test("getLastConcertsByArtist: lê DD-MM-YYYY, não MM-DD-YYYY", () => {
  // Se o parser trocasse dia e mês, 03-01 viria depois de 01-03.
  const [first] = getLastConcertsByArtist(
    [past(MBID, "01-03-2024"), past(MBID, "03-01-2024")],
    MBID,
  );

  assert.strictEqual(first.id, "01-03-2024");
  assert.strictEqual(first.dateObj.getMonth(), 2); // março
});

// Datas relativas de propósito: com o filtro de passado, data fixa no teste
// vira falha marcada no calendário.
// Montado a partir das partes locais, não de toISOString(): o selector parseia
// a data em horário local, e às 21h de um fuso negativo o UTC já é amanhã.
const dayOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test("getNextConcertsByArtist: casa pelo nome, ordena do mais próximo e ignora evento sem _embedded", () => {
  const events = [
    upcoming("Radiohead", dayOffset(600)),
    upcoming("Radiohead", dayOffset(48)),
    upcoming("Blur", dayOffset(16)),
    { id: "sem-embedded", dates: { start: { localDate: dayOffset(77) } } },
  ];

  const got = getNextConcertsByArtist(events, "Radiohead").map((e) => e.id);

  assert.deepStrictEqual(got, [dayOffset(48), dayOffset(600)]);
});

test("getNextConcertsByArtist: descarta o que já passou e mantém o show de hoje", () => {
  const events = [
    upcoming("Radiohead", dayOffset(-1)),
    upcoming("Radiohead", dayOffset(-400)),
    upcoming("Radiohead", dayOffset(0)),
    upcoming("Radiohead", dayOffset(30)),
  ];

  const got = getNextConcertsByArtist(events, "Radiohead").map((e) => e.id);

  assert.deepStrictEqual(got, [dayOffset(0), dayOffset(30)]);
});

test("getNextConcertsByArtist: lista vazia quando o nome não bate exatamente", () => {
  const events = [upcoming("Radiohead", dayOffset(48))];

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
    "wide.jpg",
  );

  assert.strictEqual(
    getBestImage([
      { ratio: "3_2", width: 100, height: 100, url: "tiny.jpg" },
      { ratio: "4_3", width: 800, height: 600, url: "big.jpg" },
    ]),
    "big.jpg",
  );

  assert.strictEqual(getBestImage([]), null);
});

test("parseSetlistDate: DD-MM-YYYY vira meia-noite LOCAL, não UTC", () => {
  const d = parseSetlistDate("16-09-2026");

  assert.strictEqual(d.getFullYear(), 2026);
  assert.strictEqual(d.getMonth(), 8); // setembro
  assert.strictEqual(d.getDate(), 16);

  // O ponto do teste. `new Date("2026-09-16")` é meia-noite UTC pela especificação,
  // que em São Paulo são 21h do dia 15 — e aí um show de amanhã entra na lista de
  // passados durante as últimas 3 horas de todo dia. Era o que a SearchPage fazia.
  assert.strictEqual(d.getHours(), 0);
  assert.notStrictEqual(d.getTime(), new Date("2026-09-16").getTime());
});
