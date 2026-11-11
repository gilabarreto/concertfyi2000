const { request } = require("../http");
const { createStore } = require("../store");
// Prazos do banco (SPEC-venues.md): achado é checado de novo em 30 dias, não achado em 7.
// Do Google só o place ID fica guardado (os termos permitem; o conteúdo, não).
const DAY = 24 * 60 * 60;
const OSM_TTL = result => (result.status === "ok" ? 30 : 7) * DAY;
const PLACE_ID_TTL = id => (id ? 365 : 7) * DAY;
const { nearby, venueNamesMatch, venueNamesOverlap } = require("../venueIdentity");
const safeUrl = value => /^https?:\/\//i.test(value || "") ? value : "";
const booleanLines = (options, labels) => Object.entries(labels).filter(([key]) => typeof options?.[key] === "boolean").map(([key, label]) => `${label}: ${options[key] ? "Yes" : "No"}`).join("\n");
const parkingLabels = { freeParkingLot: "Free parking lot", paidParkingLot: "Paid parking lot", freeStreetParking: "Free street parking", paidStreetParking: "Paid street parking", valetParking: "Valet parking", freeGarageParking: "Free garage parking", paidGarageParking: "Paid garage parking" };
const accessLabels = { wheelchairAccessibleParking: "Wheelchair-accessible parking", wheelchairAccessibleEntrance: "Wheelchair-accessible entrance", wheelchairAccessibleRestroom: "Wheelchair-accessible restroom", wheelchairAccessibleSeating: "Wheelchair-accessible seating" };
const paymentLabels = { acceptsCreditCards: "Credit cards", acceptsDebitCards: "Debit cards", acceptsCashOnly: "Cash only", acceptsNfc: "Contactless payments" };
const TRANSIT = ["train_station", "bus_station", "bus_stop", "subway_station", "transit_station", "light_rail_station"];
// Places a show can happen in. A looser name match is only trusted for one of these.
const VENUE_TYPES = ["stadium", "arena", "concert_hall", "live_music_venue", "performing_arts_theater", "event_venue", "amphitheatre", "auditorium", "night_club", "bar", "pub", "cultural_center"];
// OSM's tags for places a show can happen in (amenity, leisure or building values).
const OSM_VENUE_TYPES = ["theatre", "performing_arts_theater", "music_venue", "live_music_venue", "events_venue", "concert_hall", "arts_centre", "nightclub", "bar", "pub", "stadium", "arena", "amphitheatre", "auditorium", "community_centre"];
const field = (value, source, url, attributions = []) => value ? { value, source, url: safeUrl(url), attributions } : null;

function createVenueServicesHandlers({ fetchJson = request, apiKey = process.env.GOOGLE_PLACES_API_KEY, osmUrl = "https://nominatim.openstreetmap.org/search" } = {}) {
  // Sem banco (Node, testes) o store é memória; no Worker vem de app.locals (worker.mjs).
  const memoryStore = createStore();
  const pending = new Map();
  const fetch = (url, options = {}, timeout = 12000) => fetchJson(url, { ...options, signal: AbortSignal.timeout(timeout) });

  async function osm(identity, key, store) {
    try {
      return await store.cached(`osm:${key}`, OSM_TTL, () => loadOsm(identity));
    } catch {
      return { status: "unavailable", fields: {} };
    }
  }

  // Lança em falha (e não devolve "unavailable") para o store manter o valor antigo.
  async function loadOsm(identity) {
    const { name, lat, long, radius } = identity;
    // Nominatim, not Overpass: overpass-api.de refuses Cloudflare's egress (521) and the public
    // mirrors time out. Its policy is 1 request a second with caching; the D1 store keeps each
    // venue 30 days. ponytail: no global throttle, add one if traffic makes bursts of new venues.
    const dLat = radius / 111, dLong = radius / (111 * Math.cos((lat * Math.PI) / 180));
    const search = async q => {
      const results = await fetch(osmUrl, { headers: { "User-Agent": "ConcertFYI/1.0 (https://concertfyi.com)" }, params: { q, format: "jsonv2", extratags: 1, namedetails: 1, addressdetails: 1, limit: 10, bounded: 1, viewbox: [long - dLong, lat + dLat, long + dLong, lat - dLat].join(",") } }, 7000);
      if (!Array.isArray(results)) throw new Error("Unexpected Nominatim response");
      return results;
    };
    // The name as given first: OSM has "Vern's" with the apostrophe. Bare words only on a miss:
    // OSM has "Dickens Pub" without it. The pause keeps us inside Nominatim's 1 request a second.
    const bare = name.replace(/['’]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    try {
      let results = await search(name);
      if (!results.length && bare !== name) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        results = await search(bare);
      }
      // Back into OSM's own shape (type, id, tags) so the matching below reads raw tags.
      const elements = results.map(place => {
        // Without a house number Nominatim's address is the nearest road, not the venue's
        // (Wembley came back as a footpath): no address beats a wrong one.
        const address = place.address?.house_number ? place.address : {};
        const tags = { ...place.extratags, ...place.namedetails, name: place.namedetails?.name || place.name, "addr:housenumber": address.house_number, "addr:street": address.road, "addr:city": address.city || address.town || address.village, "addr:postcode": address.postcode, "addr:country": address.country };
        if (place.category && place.type) tags[place.category] = place.type;
        const at = { lat: Number(place.lat), lon: Number(place.lon) };
        return { type: place.osm_type, id: place.osm_id, ...(place.osm_type === "node" ? at : { center: at }), tags };
      });
      const names = tags => [tags.name, tags["name:en"], tags.official_name, ...(tags.alt_name || "").split(";")];
      const typesOf = tags => [tags.amenity, tags.leisure, tags.building, tags.amenity === "theatre" ? "performing_arts_theater" : "", tags.amenity === "music_venue" ? "live_music_venue" : ""];
      const close = elements.filter(item => {
        const tags = item.tags || {};
        return !tags.public_transport && !tags.railway && !tags.highway && !tags.route && nearby(lat, long, item.lat ?? item.center?.lat, item.lon ?? item.center?.lon, radius);
      });
      // Same ladder as Google's: exact name first; added/dropped words ("Big Four Roadhouse" /
      // "The Big Four Roadhouse") only for a place OSM tags as a venue, and only one of them.
      const strict = close.filter(item => names(item.tags || {}).some(value => venueNamesMatch(name, value, typesOf(item.tags || {}))));
      const matches = strict.length ? strict : close.filter(item => typesOf(item.tags || {}).some(type => OSM_VENUE_TYPES.includes(type)) && names(item.tags || {}).some(value => value && venueNamesOverlap(name, value)));
      // A stadium outline and its label node can represent the same physical venue.
      const unique = matches.filter(item => item.type !== "node" || !matches.some(area => area.type !== "node" && nearby(item.lat, item.lon, area.center?.lat, area.center?.lon, 0.1)));
      const item = unique.length === 1 ? unique[0] : null;
      const tags = item?.tags || {};
      const url = item ? `https://www.openstreetmap.org/${item.type}/${item.id}` : "";
      const source = "OpenStreetMap";
      const address = [[tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "), tags["addr:city"], tags["addr:postcode"], tags["addr:country"]].filter(Boolean).join(", ");
      const payments = Object.entries(tags).filter(([key]) => key.startsWith("payment:")).map(([key, value]) => `${key.slice(8).replace(/_/g, " ")}: ${value}`).join("\n");
      const at = item && { lat: item.lat ?? item.center?.lat, long: item.lon ?? item.center?.lon };
      const result = { status: item ? "ok" : "not-found", location: at?.lat != null && at.long != null ? at : null, fields: {
        address: field(address, source, url), website: field(safeUrl(tags.website || tags["contact:website"]), source, url),
        phone: field(tags.phone || tags["contact:phone"], source, url), openingHours: field(tags.opening_hours, source, url),
        accessibility: field(tags.wheelchair ? `Wheelchair access: ${tags.wheelchair}` : "", source, url),
        parking: field(tags.parking, source, url), payments: field(payments, source, url),
        description: field(tags["description:en"] || tags.description, source, url),
      } };
      return result;
    } catch (error) { console.error("venue-services osm:", error.message); throw error; }
  }

  async function google(identity, key, mode, options = {}, store = memoryStore) {
    if (!apiKey) return { status: "unconfigured", fields: {}, reviews: [] };
    try {
      const headers = { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey };
      // Só a busca (SearchText) sai do caminho; os detalhes continuam ao vivo a cada visita.
      const id = await store.cached(`google-id:${key}`, PLACE_ID_TTL, async () => {
        // Strictest evidence first; each looser rung needs a venue type and a single candidate.
        const pick = places => {
          const isVenue = place => (place.types || []).some(type => VENUE_TYPES.includes(type));
          // A hotel counts only when it's also a venue (Grey Eagle Resort & Casino); "The Palomino"
          // the apartment block isn't The Palomino the bar.
          const close = places.filter(place => !(place.types || []).some(type => TRANSIT.includes(type)) && !(place.types?.includes("lodging") && !isVenue(place)) && nearby(identity.lat, identity.long, place.location?.latitude, place.location?.longitude, identity.radius));
          // Listings append a tagline: "Café Théâtre | French Restaurant Calgary".
          const nameOf = place => (place.displayName?.text || "").split("|")[0];
          for (const rung of [
            close.filter(place => venueNamesMatch(identity.name, nameOf(place), place.types)),
            close.filter(place => isVenue(place) && venueNamesOverlap(identity.name, nameOf(place))),
            // Google ranks by relevance, so with Ticketmaster's exact pin its top answer may stand in
            // for a sponsor rename that shares no words with the old name.
            identity.exact && close[0] && close[0] === places[0] && isVenue(close[0]) ? [close[0]] : [],
          ]) if (rung.length) return rung.length === 1 ? rung[0] : null;
          return null;
        };
        // "Name, City" is a second search (Text Search Pro, 5,000 free a month), spent only on a miss.
        let picked = null;
        for (const textQuery of [identity.name, identity.city && `${identity.name}, ${identity.city}`].filter(Boolean)) {
          const data = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { ...headers, "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.types" }, body: JSON.stringify({ textQuery, languageCode: "en", locationBias: { circle: { center: { latitude: identity.lat, longitude: identity.long }, radius: identity.radius * 1000 } } }) });
          picked = pick(data.places || []);
          if (picked) break;
        }
        const found = picked?.id;
        return typeof found === "string" && /^[a-zA-Z0-9_-]+$/.test(found) ? found : null;
      });
      if (!id) return { status: "not-found", fields: {}, reviews: [] };
      // Billing follows the priciest field. editorialSummary/parking/payments already make this
      // Enterprise + Atmosphere (1,000 free a month), so reviews ride along at no extra cost;
      // the photo list stays IDs Only, which is unbilled. Photos are their own click
      // (SPEC-google-on-click.md): whoever only wants the rating spends no media calls.
      const mask = mode === "photos" ? "photos,attributions" : "location,reviews,formattedAddress,websiteUri,internationalPhoneNumber,regularOpeningHours,accessibilityOptions,parkingOptions,paymentOptions,editorialSummary,rating,userRatingCount,googleMapsUri,attributions";
      const place = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, { headers: { ...headers, "X-Goog-FieldMask": mask }, params: { languageCode: "en" } });
      const attributions = (place.attributions || []).map(item => ({ name: item.provider, url: safeUrl(item.providerUri) }));
      const source = "Google Maps", url = safeUrl(place.googleMapsUri) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(identity.name)}&query_place_id=${id}`;
      if (mode === "photos") {
        const { offset, limit } = options;
        const photos = (place.photos || []).slice(0, 10);
        const results = await Promise.allSettled(photos.slice(offset, offset + limit).map(async photo => {
          if (typeof photo.name !== "string" || !photo.name.startsWith(`places/${id}/photos/`) || !/^places\/[a-zA-Z0-9_-]+\/photos\/[a-zA-Z0-9_-]+$/.test(photo.name)) throw new Error("Invalid photo resource");
          const media = await fetch(`https://places.googleapis.com/v1/${photo.name}/media`, { headers: { "X-Goog-Api-Key": apiKey }, params: { maxWidthPx: 600, maxHeightPx: 600, skipHttpRedirect: true } });
          const imageUrl = safeUrl(media.photoUri);
          if (!imageUrl) throw new Error("Missing photo URL");
          return { imageUrl, authors: (photo.authorAttributions || []).map(author => ({ name: author.displayName, url: safeUrl(author.uri) })) };
        }));
        return { status: "ok", source, url, attributions, total: photos.length, offset, photos: results.filter(item => item.status === "fulfilled").map(item => item.value), partial: results.some(item => item.status === "rejected") };
      }
      const reviews = (place.reviews || []).slice(0, 5).map(review => ({ rating: review.rating, text: review.text?.text || review.originalText?.text || "", author: review.authorAttribution?.displayName || "Google Maps user", authorUrl: safeUrl(review.authorAttribution?.uri), photoUrl: safeUrl(review.authorAttribution?.photoUri), published: review.relativePublishTimeDescription || "", url: safeUrl(review.googleMapsUri) }));
      const location = Number.isFinite(place.location?.latitude) && Number.isFinite(place.location?.longitude) ? { lat: place.location.latitude, long: place.location.longitude } : null;
      return { status: "ok", reviews, location, fields: {
        address: field(place.formattedAddress, source, url, attributions), website: field(safeUrl(place.websiteUri), source, url, attributions), phone: field(place.internationalPhoneNumber, source, url, attributions),
        openingHours: field(place.regularOpeningHours?.weekdayDescriptions?.join("\n"), source, url, attributions),
        accessibility: field(booleanLines(place.accessibilityOptions, accessLabels), source, url, attributions), parking: field(booleanLines(place.parkingOptions, parkingLabels), source, url, attributions), payments: field(booleanLines(place.paymentOptions, paymentLabels), source, url, attributions),
        description: field(place.editorialSummary?.text, source, url, attributions),
        rating: typeof place.rating === "number" ? { value: place.rating, count: place.userRatingCount ?? null, source, url, attributions } : null,
      } };
    } catch (error) {
      // The message is "<status> <url>" from http.js; the key travels in a header, never the URL.
      console.error(`venue-services google ${mode}:`, error.message);
      return { status: "unavailable", fields: {}, reviews: [] };
    }
  }

  async function load(identity, key, mode, options, store) {
    if (mode !== "services") return google(identity, key, mode, options, store);
    // Google only on the visitor's click (SPEC-google-on-click.md); opening the page is OSM alone.
    // In parallel: Google almost never fills every field, so waiting on it first only
    // stacked Overpass's latency (up to its timeout) behind Google's.
    const [primary, fallback] = await Promise.all([options.google ? google(identity, key, "services", {}, store) : { status: "skipped", fields: {}, reviews: [] }, osm(identity, key, store)]);
    const fields = { ...fallback.fields };
    for (const [key, value] of Object.entries(primary.fields)) if (value) fields[key] = value;
    // The matched building's pin, for the map; never fed back into the identity.
    return { fields, reviews: primary.reviews, location: primary.location || fallback.location || null, providers: { google: primary.status, osm: fallback.status }, partial: primary.status === "unavailable" || fallback.status === "unavailable" };
  }

  const handler = mode => async (req, res) => {
    const { name } = req.query;
    const lat = Number(req.query.lat), long = Number(req.query.long);
    if (typeof name !== "string" || !name.trim() || name.length > 200 || typeof req.query.lat !== "string" || !req.query.lat.trim() || typeof req.query.long !== "string" || !req.query.long.trim() || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(long) || Math.abs(long) > 180) return res.status(400).json({ error: "Missing or invalid name/coordinates" });
    const { city } = req.query;
    if (city !== undefined && (typeof city !== "string" || city.length > 100)) return res.status(400).json({ error: "Invalid city" });
    const exact = req.query.exact === "true";
    const identity = { name: name.trim(), lat, long, exact, radius: exact ? 1.5 : 30, city: city?.trim() || undefined };
    const options = mode === "services" ? { google: req.query.google === "true" } : { offset: Number(req.query.offset ?? 0), limit: Number(req.query.limit ?? 3) };
    if (mode === "photos" && (!Number.isInteger(options.offset) || options.offset < 0 || options.offset > 9 || ![1, 3, 6].includes(options.limit))) return res.status(400).json({ error: "Invalid photo page" });
    const key = JSON.stringify(identity);
    const pendingKey = `${mode}:${key}:${JSON.stringify(options)}`;
    if (!pending.has(pendingKey)) {
      if (pending.size >= 8) return res.status(503).json({ error: "Venue information busy" });
      pending.set(pendingKey, load(identity, key, mode, options, req.app?.locals?.store || memoryStore).finally(() => pending.delete(pendingKey)));
    }
    res.set("Cache-Control", "no-store");
    return res.json(await pending.get(pendingKey));
  };
  return { services: handler("services"), photos: handler("photos") };
}
module.exports = createVenueServicesHandlers();
module.exports.createVenueServicesHandlers = createVenueServicesHandlers;
