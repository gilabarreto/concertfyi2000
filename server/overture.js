const { nearby, normalize, venueNamesMatch, venueNamesOverlap } = require("./venueIdentity");

// Venues do Overture Maps guardadas no D1 (schema.sql, scripts/overture-venues.py): site,
// telefone e endereço de bar e casa pequena que o OSM não tem. Só EUA e Canadá por enquanto.
const SOURCE = "Overture Maps";
const URL = "https://overturemaps.org";
const LICENSE = [{ name: "CDLA-Permissive-2.0", url: "https://cdla.dev/permissive-2-0/" }];
// As categorias do Overture nos tipos que venueIdentity e o casamento frouxo entendem.
const TYPES = {
  music_venue: ["live_music_venue", "concert_hall"],
  stadium_arena: ["stadium", "arena"],
  theatre_venue: ["performing_arts_theater"],
  performing_arts_venue: ["performing_arts_theater"],
  event_venue: ["event_venue"],
  dance_club: ["night_club"],
  nightlife_venue: ["night_club"],
  comedy_club: ["event_venue"],
  bar: ["bar", "pub"],
  alcoholic_beverage_venue: ["bar", "pub"],
  brewery: ["bar"],
};

const field = (value) =>
  value ? { value, source: SOURCE, url: URL, attributions: LICENSE } : null;

async function overtureVenue(db, { name, lat, long, radius }) {
  if (!db) return { status: "skipped", fields: {} };
  const dLat = radius / 111;
  const dLong = radius / (111 * Math.cos((lat * Math.PI) / 180));
  const bands = [];
  for (let band = Math.floor((lat - dLat) * 4); band <= Math.floor((lat + dLat) * 4); band++)
    bands.push(band);
  // Uma leitura por faixa, todas na chave primária: só as linhas da caixa são lidas.
  const { results } = await db
    .prepare(
      `SELECT * FROM venues WHERE band IN (${bands.map(() => "?").join(",")}) AND lon BETWEEN ? AND ? AND lat BETWEEN ? AND ?`,
    )
    .bind(...bands, long - dLong, long + dLong, lat - dLat, lat + dLat)
    .all();
  const close = results.filter((row) => nearby(lat, long, row.lat, row.lon, radius));
  const types = (row) => TYPES[row.category] || [];
  const strict = close.filter((row) => venueNamesMatch(name, row.name, types(row)));
  const matches = strict.length
    ? strict
    : close.filter((row) => types(row).length && venueNamesOverlap(name, row.name));
  // O Overture junta fontes e às vezes traz o mesmo lugar duas vezes: mesmo nome conta como um,
  // e fica o que tem mais dados.
  if (new Set(matches.map((row) => normalize(row.name))).size !== 1)
    return { status: "not-found", fields: {} };
  const filled = (row) => [row.website, row.phone, row.address].filter(Boolean).length;
  const row = matches.sort((a, b) => filled(b) - filled(a))[0];
  return {
    status: "ok",
    location: { lat: row.lat, long: row.lon },
    fields: {
      address: field(row.address),
      website: field(/^https?:\/\//i.test(row.website || "") ? row.website : ""),
      phone: field(row.phone),
    },
  };
}

module.exports = { overtureVenue };
