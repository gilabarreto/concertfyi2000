const { request } = require("../http");
const { createStore } = require("../store");

// Cidade do visitante a partir da coordenada do navegador. Passa por aqui, e não direto do
// browser ao Nominatim, porque a política dele pede User-Agent identificado e cache.
// Arredondada a 2 casas (~1 km): o Nominatim nunca vê a posição exata e quem mora no mesmo
// bairro divide uma linha no D1. Dado OSM (ODbL) pode ser guardado; 30 dias.
const TTL = 30 * 24 * 60 * 60;

function createReverseGeocodeHandler({ fetchJson = request, memoryStore = createStore() } = {}) {
  const load = async (lat, long) => {
    const data = await fetchJson("https://nominatim.openstreetmap.org/reverse", {
      headers: { "User-Agent": "ConcertFYI/1.0 (https://concertfyi.com)" },
      params: { format: "jsonv2", lat, lon: long, zoom: 10, "accept-language": "en" },
      signal: AbortSignal.timeout(7000),
    });
    const address = data?.address;
    if (!address) throw new Error("Unexpected Nominatim response");
    return {
      city: address.city || address.town || address.village || address.municipality || null,
      country: address.country || null,
    };
  };

  return async (req, res) => {
    const lat = Number(req.query.lat);
    const long = Number(req.query.long);
    if (
      req.query.lat == null ||
      req.query.long == null ||
      !Number.isFinite(lat) ||
      Math.abs(lat) > 90 ||
      !Number.isFinite(long) ||
      Math.abs(long) > 180
    )
      return res.status(400).json({ error: "Missing or invalid coordinates" });
    const [rLat, rLong] = [lat.toFixed(2), long.toFixed(2)];
    const store = req.app?.locals?.store || memoryStore;
    try {
      const place = await store.cached(`reverse:${rLat},${rLong}`, TTL, () => load(rLat, rLong));
      res.set("Cache-Control", "public, max-age=86400");
      return res.json(place);
    } catch {
      return res.status(502).json({ error: "Reverse geocoding failed" });
    }
  };
}

module.exports = createReverseGeocodeHandler();
module.exports.createReverseGeocodeHandler = createReverseGeocodeHandler;
