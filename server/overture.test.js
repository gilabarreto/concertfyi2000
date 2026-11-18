const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { overtureVenue } = require("./overture");

// O schema de verdade num SQLite em memória, por trás da mesma interface do D1.
function d1(rows) {
  const db = new DatabaseSync(":memory:");
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  const insert = db.prepare(
    "INSERT INTO venues (band, lon, id, lat, name, category, website, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const r of rows)
    insert.run(
      Math.floor(r.lat * 4),
      r.lon,
      r.id,
      r.lat,
      r.name,
      r.category,
      r.website ?? null,
      r.phone ?? null,
      r.address ?? null,
    );
  return {
    prepare: (sql) => ({
      bind: (...args) => ({ all: async () => ({ results: db.prepare(sql).all(...args) }) }),
    }),
  };
}
// Calgary: o Saddledome cai em outra faixa de latitude que o Arrowhead, e a busca cobre as duas.
const rows = [
  {
    id: "a",
    name: "The Arrowhead",
    category: "music_venue",
    lat: 51.0381,
    lon: -114.0716,
    website: "https://arrowhead.example",
  },
  {
    id: "k1",
    name: "Knoxvilles Tavern",
    category: "nightlife_venue",
    lat: 51.0449,
    lon: -114.0626,
  },
  {
    id: "k2",
    name: "Knoxvilles Tavern",
    category: "nightlife_venue",
    lat: 51.045,
    lon: -114.0627,
    phone: "+1 403 555 0100",
    address: "840 9 Ave SW, Calgary, AB",
  },
  {
    id: "s",
    name: "Scotiabank Saddledome",
    category: "stadium_arena",
    lat: 51.0374,
    lon: -114.0519,
    phone: "+1 403 777 2177",
  },
  {
    id: "far",
    name: "The Arrowhead",
    category: "music_venue",
    lat: 53.5461,
    lon: -113.4938,
    website: "https://edmonton.example",
    phone: "+1 780 555 0100",
  },
];
const at = (name, radius = 30) => ({ name, lat: 51.045, long: -114.06, radius });

// O homônimo de Edmonton tem mais dados e ganharia se o raio deixasse ele entrar.
test("finds a venue by name near the coordinate and credits Overture", async () => {
  const found = await overtureVenue(d1(rows), at("The Arrowhead"));
  assert.equal(found.status, "ok");
  assert.equal(found.fields.website.value, "https://arrowhead.example");
  assert.equal(found.fields.website.source, "Overture Maps");
  assert.equal(found.fields.phone, null);
});

test("the same place listed twice counts once, keeping the fuller row", async () => {
  const found = await overtureVenue(d1(rows), at("Knoxville's Tavern"));
  assert.equal(found.fields.phone.value, "+1 403 555 0100");
});

test("an added word matches only a venue-typed place; a miss is not-found", async () => {
  assert.equal((await overtureVenue(d1(rows), at("Saddledome"))).status, "ok");
  assert.equal((await overtureVenue(d1(rows), at("Commonwealth Bar & Stage"))).status, "not-found");
});

test("without a database it skips", async () => {
  assert.equal((await overtureVenue(undefined, at("The Arrowhead"))).status, "skipped");
});
