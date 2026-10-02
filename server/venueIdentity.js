const normalize = value => (value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const descriptors = {
  pub: ["pub"], bar: ["bar", "pub"], arena: ["arena", "stadium"], stadium: ["stadium"],
  theatre: ["performing_arts_theater", "movie_theater"], theater: ["performing_arts_theater", "movie_theater"],
  "concert hall": ["concert_hall", "live_music_venue"], "music hall": ["concert_hall", "live_music_venue"],
};
function venueNameParts(name) {
  const suffix = String(name || "").trim().match(/\s+(concert hall|music hall|pub|bar|arena|stadium|theatre|theater)$/i);
  const rawBase = suffix ? name.trim().slice(0, -suffix[0].length) : String(name || "").trim();
  return { base: normalize(rawBase), rawBase, descriptor: suffix?.[1].toLowerCase() || "" };
}
function venueNamesMatch(requested, candidate, types = []) {
  if (normalize(requested) === normalize(candidate)) return true;
  const a = venueNameParts(requested), b = venueNameParts(candidate);
  if (a.base.length < 4 || a.base !== b.base || (!a.descriptor && !b.descriptor)) return false;
  // Descriptor differences require independent confirmation of the venue category.
  return [a.descriptor, b.descriptor].filter(Boolean).every(descriptor => descriptors[descriptor].some(type => types.includes(type)));
}

function nearby(lat, long, otherLat, otherLong, radius = 30) {
  if ([lat, long, otherLat, otherLong].some(value => value == null || value === "")) return false;
  const values = [lat, long, otherLat, otherLong].map(Number);
  if (!values.every(Number.isFinite) || Math.abs(values[0]) > 90 || Math.abs(values[2]) > 90 || Math.abs(values[1]) > 180 || Math.abs(values[3]) > 180) return false;
  const radians = value => value * Math.PI / 180;
  const [a, b, c, d] = values;
  const distance = Math.sin(radians(c - a) / 2) ** 2 + Math.cos(radians(a)) * Math.cos(radians(c)) * Math.sin(radians(d - b) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(distance, 1))) <= radius;
}

function findTicketmasterVenue(venues = [], name, lat, long) {
  const matches = venues.filter(venue =>
    [venue.name, ...(venue.aliases || [])].some(value => normalize(value) === normalize(name)) &&
    nearby(lat, long, venue.location?.latitude, venue.location?.longitude));
  return matches.length === 1 ? matches[0] : null;
}
module.exports = { normalize, nearby, findTicketmasterVenue, venueNamesMatch, venueNameParts };
