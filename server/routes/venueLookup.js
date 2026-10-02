const { request } = require("../http");
const { normalize, nearby } = require("../venueIdentity");

// Ticketmaster and setlist.fm venue IDs are separate namespaces. Resolve only one
// exact name/city/country match, and retain the Ticketmaster profile when none exists.
function createVenueLookupHandler({ fetchJson = request } = {}) {
  const cache = new Map();
  return async (req, res) => {
    const id = req.params.venueId;
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id || "")) return res.status(400).json({ error: "Invalid venue id" });
    const saved = cache.get(id);
    if (saved?.expires > Date.now()) return res.json(saved.data);
    try {
      const ticketmaster = await fetchJson(`https://app.ticketmaster.com/discovery/v2/venues/${id}.json`, {
        params: { apikey: process.env.TICKETMASTER_API_KEY }, signal: AbortSignal.timeout(10000),
      });
      if (ticketmaster?.id !== id || !ticketmaster.name) return res.status(404).json({ error: "Venue not found" });
      const lat = ticketmaster.location?.latitude, long = ticketmaster.location?.longitude;
      const venue = {
        id: `ticketmaster:${id}`, name: ticketmaster.name,
        city: { name: ticketmaster.city?.name, state: ticketmaster.state?.name,
          country: { name: ticketmaster.country?.name, code: ticketmaster.country?.countryCode },
          ...(lat != null && long != null ? { coords: { lat: Number(lat), long: Number(long) } } : {}),
        },
      };
      let setlistVenueId = null, partial = false;
      try {
        const result = await fetchJson("https://api.setlist.fm/rest/1.0/search/venues", {
          params: { name: venue.name, cityName: venue.city.name, country: venue.city.country.code, p: 1 },
          headers: { Accept: "application/json", "x-api-key": process.env.SETLISTFM_API_KEY }, signal: AbortSignal.timeout(10000),
        });
        const matches = (result.venue || []).filter(item =>
          normalize(item.name) === normalize(venue.name) &&
          !!venue.city.name && normalize(item.city?.name) === normalize(venue.city.name) &&
          (!venue.city.country.code || normalize(item.city?.country?.code) === normalize(venue.city.country.code)) &&
          (!venue.city.coords || !item.city?.coords || nearby(lat, long, item.city.coords.lat, item.city.coords.long)));
        const ids = [...new Set(matches.map(item => item.id).filter(id => /^[0-9a-f]{6,10}$/i.test(id || "")))];
        if (ids.length === 1 && result.total <= result.itemsPerPage) setlistVenueId = ids[0];
      } catch (error) { partial = error.status !== 404; }
      const data = { venue, ticketmaster, setlistVenueId, partial };
      if (!partial) {
        if (cache.size >= 200) cache.delete(cache.keys().next().value);
        cache.set(id, { data, expires: Date.now() + 60 * 60 * 1000 });
      }
      return res.json(data);
    } catch (error) {
      return res.status(error.status === 404 ? 404 : 502).json({ error: "Venue fetch failed" });
    }
  };
}
module.exports = createVenueLookupHandler();
module.exports.createVenueLookupHandler = createVenueLookupHandler;
