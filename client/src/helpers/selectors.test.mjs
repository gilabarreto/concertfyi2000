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
  getCarouselSlides,
  parseSetlistDate,
  formatArtistBackground,
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

// A Ticketmaster oferece a mesma foto em 100, 205, 640, 1024, 1136 e 2048 de largura,
// e às vezes um _SOURCE de vários MB. Pegar a maior custou 21,7 MB na home e um LCP
// de 115s no mobile (Lighthouse, 2026-09-15). O certo é a menor que ainda cobre o
// espaço onde ela vai aparecer.
const tmSizes = [100, 205, 640, 1024, 1136, 2048].map((width) => ({
  ratio: "16_9",
  width,
  height: Math.round((width * 9) / 16),
  url: `${width}.jpg`,
}));

test("getBestImage: pega a menor que cobre a largura pedida, não a maior que existe", () => {
  assert.strictEqual(getBestImage(tmSizes, 640), "640.jpg");
  assert.strictEqual(getBestImage(tmSizes, 1024), "1024.jpg");

  // 800 não existe: sobe para a próxima que cobre, nunca desce para uma borrada.
  assert.strictEqual(getBestImage(tmSizes, 800), "1024.jpg");
});

test("getBestImage: se nenhuma cobre a largura pedida, fica com a maior disponível", () => {
  assert.strictEqual(getBestImage(tmSizes, 4000), "2048.jpg");
});

test("getBestImage: sem 16_9, escolhe entre as outras pelo mesmo critério", () => {
  assert.strictEqual(
    getBestImage(
      [
        { ratio: "3_2", width: 4000, height: 2666, url: "huge.jpg" },
        { ratio: "3_2", width: 640, height: 427, url: "ok.jpg" },
        { ratio: "4_3", width: 305, height: 225, url: "tiny.jpg" },
      ],
      640,
    ),
    "ok.jpg",
  );
});

test("getBestImage: ignora o _SOURCE gigante quando há uma variante que serve", () => {
  // Era daqui que vinham 18,1 MB dos 21,7 MB da home: 27 originais sem redimensionar.
  assert.strictEqual(
    getBestImage(
      [
        { ratio: "16_9", width: 640, height: 360, url: "640.jpg" },
        { ratio: "16_9", width: 4928, height: 2772, url: "foto_SOURCE" },
      ],
      640,
    ),
    "640.jpg",
  );
});

test("getBestImage: lista vazia devolve null", () => {
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

// Ticketmaster: /ticketmaster/events devolve `_embedded.events`, cada um com
// `_embedded.attractions` — que é quem tem o artista.
const event = (id, artistName, extra = {}) => ({
  id,
  name: `${artistName} live`,
  dates: { start: { localDate: "2026-10-01" } },
  _embedded: { attractions: [{ id: `att-${artistName}`, name: artistName }] },
  ...extra,
});

// A ordem sai sorteada, então comparar lista com lista testaria o Math.random.
const artistsOf = (slides) => slides.map((s) => s.artistName).sort();

test("getCarouselSlides: um slide por artista, o primeiro evento dele", () => {
  const slides = getCarouselSlides({
    _embedded: {
      events: [event("e1", "Kehlani"), event("e2", "Kehlani"), event("e3", "Fisher")],
    },
  });

  assert.strictEqual(slides.length, 2);
  assert.deepStrictEqual(artistsOf(slides), ["Fisher", "Kehlani"]);
  assert.strictEqual(slides.find((s) => s.artistName === "Kehlani").eventId, "e1");
});

test("getCarouselSlides: evento sem attraction fica de fora", () => {
  const slides = getCarouselSlides({
    _embedded: {
      events: [{ id: "sem", name: "Festival", dates: { start: { localDate: "2026-10-01" } } }],
    },
  });

  assert.deepStrictEqual(slides, []);
});

test("getCarouselSlides: resposta vazia ou sem _embedded não quebra", () => {
  assert.deepStrictEqual(getCarouselSlides(undefined), []);
  assert.deepStrictEqual(getCarouselSlides({}), []);
  assert.deepStrictEqual(getCarouselSlides({ _embedded: {} }), []);
});

test("getCarouselSlides: o slide leva o que o carrossel desenha", () => {
  const [slide] = getCarouselSlides({
    _embedded: { events: [event("e1", "Kehlani", { images: [{ width: 640 }] })] },
  });

  assert.deepStrictEqual(slide, {
    eventId: "e1",
    artistId: "att-Kehlani",
    artistName: "Kehlani",
    title: "Kehlani live",
    date: "2026-10-01",
    images: [{ width: 640 }],
  });
});

test("getCarouselSlides: sem imagem vira lista vazia, não undefined", () => {
  const [slide] = getCarouselSlides({ _embedded: { events: [event("e1", "Fisher")] } });

  assert.deepStrictEqual(slide.images, []);
});

const member = (name, ended) => ({ type: "member of band", artist: { name }, ended });

test("formatArtistBackground: origin leva o ano de início entre parênteses, gêneros por contagem, só quem ainda está na banda", () => {
  const got = formatArtistBackground({
    "begin-area": { name: "Venice" },
    area: { name: "United States" },
    genres: [
      { name: "rock", count: 10 },
      { name: "acid rock", count: 21 },
      { name: "pop", count: 1 },
      { name: "hard rock", count: 4 },
      { name: "blues rock", count: 18 },
    ],
    "life-span": { begin: "1965-07", end: "1973-01", ended: true },
    relations: [
      { type: "other databases" }, // tipo que não é integrante, tem que ser ignorado
      member("Jim Morrison", true), // saiu, não aparece
      member("Ray Manzarek", false),
    ],
  });

  assert.strictEqual(got.origin, "Venice, United States (1965)");
  assert.deepStrictEqual(got.genres, ["acid rock", "blues rock", "rock", "hard rock"]);
  assert.deepStrictEqual(got.currentMembers, ["Ray Manzarek"]);
});

test("formatArtistBackground: sem ano de início, origin fica só o lugar", () => {
  const got = formatArtistBackground({ area: { name: "United States" } });

  assert.strictEqual(got.origin, "United States");
});

test("formatArtistBackground: sem dados não quebra", () => {
  assert.deepStrictEqual(formatArtistBackground(), {
    origin: "",
    genres: [],
    currentMembers: [],
  });
});
