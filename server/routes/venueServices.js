const { request } = require("../http");
const { nearby, venueNamesMatch, venueNameParts } = require("../venueIdentity");
const safeUrl = value => /^https?:\/\//i.test(value || "") ? value : "";
const booleanLines = (options, labels) => Object.entries(labels).filter(([key]) => typeof options?.[key] === "boolean").map(([key, label]) => `${label}: ${options[key] ? "Yes" : "No"}`).join("\n");
const parkingLabels = { freeParkingLot: "Free parking lot", paidParkingLot: "Paid parking lot", freeStreetParking: "Free street parking", paidStreetParking: "Paid street parking", valetParking: "Valet parking", freeGarageParking: "Free garage parking", paidGarageParking: "Paid garage parking" };
const accessLabels = { wheelchairAccessibleParking: "Wheelchair-accessible parking", wheelchairAccessibleEntrance: "Wheelchair-accessible entrance", wheelchairAccessibleRestroom: "Wheelchair-accessible restroom", wheelchairAccessibleSeating: "Wheelchair-accessible seating" };
const paymentLabels = { acceptsCreditCards: "Credit cards", acceptsDebitCards: "Debit cards", acceptsCashOnly: "Cash only", acceptsNfc: "Contactless payments" };
const field = (value, source, url, attributions = []) => value ? { value, source, url: safeUrl(url), attributions } : null;

function createVenueServicesHandlers({ fetchJson = request, apiKey = process.env.GOOGLE_PLACES_API_KEY, overpassUrl = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter" } = {}) {
  const osmCache = new Map();
  const placeIds = new Map(); // Only place IDs are retained; Google content is never cached.
  const pending = new Map();
  const fetch = (url, options = {}) => fetchJson(url, { ...options, signal: AbortSignal.timeout(12000) });
  const remember = (map, key, value, ttl) => { if (map.size >= 200) map.delete(map.keys().next().value); map.set(key, { value, expires: Date.now() + ttl }); };

  async function osm(identity, key) {
    const cached = osmCache.get(key);
    if (cached?.expires > Date.now()) return cached.value;
    const { name, lat, long, radius } = identity;
    // Optional punctuation accommodates Dicken's Pub / Dickens without a per-venue alias.
    const escaped = [...venueNameParts(name).rawBase].filter(char => /[\p{L}\p{N}]/u.test(char)).join("[^[:alnum:]]*");
    const query = `[out:json][timeout:10];nwr(around:${radius * 1000},${lat},${long})[~"^(name|name:en|official_name|alt_name)$"~${JSON.stringify(escaped)},i];out center tags;`;
    try {
      const data = await fetch(overpassUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ConcertFYI/1.0 (https://concertfyi.com)" }, body: new URLSearchParams({ data: query }).toString() });
      if (data.remark) throw new Error("Incomplete Overpass response");
      const matches = (data.elements || []).filter(item => {
        const tags = item.tags || {};
        const types = [tags.amenity, tags.leisure, tags.building, tags.amenity === "theatre" ? "performing_arts_theater" : "", tags.amenity === "music_venue" ? "live_music_venue" : ""];
        return !tags.public_transport && !tags.railway && !tags.highway && !tags.route && [tags.name, tags["name:en"], tags.official_name, ...(tags.alt_name || "").split(";")].some(value => venueNamesMatch(name, value, types)) && nearby(lat, long, item.lat ?? item.center?.lat, item.lon ?? item.center?.lon, radius);
      });
      // A stadium outline and its label node can represent the same physical venue.
      const unique = matches.filter(item => item.type !== "node" || !matches.some(area => area.type !== "node" && nearby(item.lat, item.lon, area.center?.lat, area.center?.lon, 0.1)));
      const item = unique.length === 1 ? unique[0] : null;
      const tags = item?.tags || {};
      const url = item ? `https://www.openstreetmap.org/${item.type}/${item.id}` : "";
      const source = "OpenStreetMap";
      const address = [[tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "), tags["addr:city"], tags["addr:postcode"], tags["addr:country"]].filter(Boolean).join(", ");
      const payments = Object.entries(tags).filter(([key]) => key.startsWith("payment:")).map(([key, value]) => `${key.slice(8).replace(/_/g, " ")}: ${value}`).join("\n");
      const result = { status: item ? "ok" : "not-found", fields: {
        address: field(address, source, url), website: field(safeUrl(tags.website || tags["contact:website"]), source, url),
        phone: field(tags.phone || tags["contact:phone"], source, url), openingHours: field(tags.opening_hours, source, url),
        accessibility: field(tags.wheelchair ? `Wheelchair access: ${tags.wheelchair}` : "", source, url),
        parking: field(tags.parking, source, url), payments: field(payments, source, url),
        description: field(tags["description:en"] || tags.description, source, url),
      } };
      remember(osmCache, key, result, 60 * 60 * 1000);
      return result;
    } catch { return { status: "unavailable", fields: {} }; }
  }

  async function google(identity, key, mode, photoOptions = {}) {
    if (!apiKey) return { status: "unconfigured", fields: {}, reviews: [] };
    const reviews = mode === "reviews";
    try {
      let id = placeIds.get(key)?.expires > Date.now() ? placeIds.get(key).value : null;
      const headers = { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey };
      if (!id) {
        const data = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { ...headers, "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.types" }, body: JSON.stringify({ textQuery: identity.name, languageCode: "en", locationBias: { circle: { center: { latitude: identity.lat, longitude: identity.long }, radius: identity.radius * 1000 } } }) });
        const matches = (data.places || []).filter(place => !(place.types || []).some(type => ["train_station", "bus_station", "bus_stop", "subway_station", "transit_station", "light_rail_station"].includes(type)) && venueNamesMatch(identity.name, place.displayName?.text, place.types) && nearby(identity.lat, identity.long, place.location?.latitude, place.location?.longitude, identity.radius));
        if (matches.length !== 1) return { status: "not-found", fields: {}, reviews: [] };
        id = matches[0].id;
        if (typeof id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(id)) return { status: "not-found", fields: {}, reviews: [] };
        remember(placeIds, key, id, 24 * 60 * 60 * 1000);
      }
      const mask = mode === "photos" ? "photos,googleMapsUri,attributions" : reviews ? "rating,userRatingCount,reviews,googleMapsUri,attributions" : "formattedAddress,websiteUri,internationalPhoneNumber,regularOpeningHours,accessibilityOptions,parkingOptions,paymentOptions,editorialSummary,rating,userRatingCount,googleMapsUri,attributions";
      const place = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, { headers: { ...headers, "X-Goog-FieldMask": mask }, params: { languageCode: "en" } });
      const attributions = (place.attributions || []).map(item => ({ name: item.provider, url: safeUrl(item.providerUri) }));
      const source = "Google Maps", url = safeUrl(place.googleMapsUri);
      if (mode === "photos") {
        const photos = (place.photos || []).slice(0, 10);
        const { offset, limit } = photoOptions;
        const results = await Promise.allSettled(photos.slice(offset, offset + limit).map(async photo => {
          if (typeof photo.name !== "string" || !photo.name.startsWith(`places/${id}/photos/`) || !/^places\/[a-zA-Z0-9_-]+\/photos\/[a-zA-Z0-9_-]+$/.test(photo.name)) throw new Error("Invalid photo resource");
          const media = await fetch(`https://places.googleapis.com/v1/${photo.name}/media`, { headers: { "X-Goog-Api-Key": apiKey }, params: { maxWidthPx: 600, maxHeightPx: 600, skipHttpRedirect: true } });
          const imageUrl = safeUrl(media.photoUri);
          if (!imageUrl) throw new Error("Missing photo URL");
          return { imageUrl, authors: (photo.authorAttributions || []).map(author => ({ name: author.displayName, url: safeUrl(author.uri) })) };
        }));
        return { status: "ok", source, url, attributions, total: photos.length, offset, photos: results.filter(item => item.status === "fulfilled").map(item => item.value), partial: results.some(item => item.status === "rejected") };
      }
      if (reviews) return { status: "ok", source, url, attributions, rating: place.rating ?? null, count: place.userRatingCount ?? null, reviews: (place.reviews || []).slice(0, 5).map(review => ({ rating: review.rating, text: review.text?.text || review.originalText?.text || "", author: review.authorAttribution?.displayName || "Google Maps user", authorUrl: safeUrl(review.authorAttribution?.uri), photoUrl: safeUrl(review.authorAttribution?.photoUri), published: review.relativePublishTimeDescription || "", url: safeUrl(review.googleMapsUri) })) };
      return { status: "ok", fields: {
        address: field(place.formattedAddress, source, url, attributions), website: field(safeUrl(place.websiteUri), source, url, attributions), phone: field(place.internationalPhoneNumber, source, url, attributions),
        openingHours: field(place.regularOpeningHours?.weekdayDescriptions?.join("\n"), source, url, attributions),
        accessibility: field(booleanLines(place.accessibilityOptions, accessLabels), source, url, attributions), parking: field(booleanLines(place.parkingOptions, parkingLabels), source, url, attributions), payments: field(booleanLines(place.paymentOptions, paymentLabels), source, url, attributions),
        description: field(place.editorialSummary?.text, source, url, attributions),
        rating: typeof place.rating === "number" ? { value: place.rating, count: place.userRatingCount ?? null, source, url, attributions } : null,
      } };
    } catch { return { status: "unavailable", fields: {}, reviews: [] }; }
  }

  async function load(identity, key, mode, photoOptions) {
    if (mode !== "services") return google(identity, key, mode, photoOptions);
    const primary = await google(identity, key, "services");
    const needsFallback = ["address", "website", "phone", "openingHours", "accessibility", "parking", "payments", "description"].some(key => !primary.fields[key]);
    const fallback = needsFallback ? await osm(identity, key) : { status: "unused", fields: {} };
    const fields = { ...fallback.fields };
    for (const [key, value] of Object.entries(primary.fields)) if (value) fields[key] = value;
    return { fields, providers: { google: primary.status, osm: fallback.status }, partial: primary.status === "unavailable" || fallback.status === "unavailable" };
  }

  const handler = mode => async (req, res) => {
    const { name } = req.query;
    const lat = Number(req.query.lat), long = Number(req.query.long);
    if (typeof name !== "string" || !name.trim() || name.length > 200 || typeof req.query.lat !== "string" || !req.query.lat.trim() || typeof req.query.long !== "string" || !req.query.long.trim() || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(long) || Math.abs(long) > 180) return res.status(400).json({ error: "Missing or invalid name/coordinates" });
    const identity = { name: name.trim(), lat, long, radius: req.query.exact === "true" ? 1.5 : 30 };
    const photoOptions = { offset: Number(req.query.offset ?? 0), limit: Number(req.query.limit ?? 3) };
    if (mode === "photos" && (!Number.isInteger(photoOptions.offset) || photoOptions.offset < 0 || photoOptions.offset > 9 || ![1, 3, 6].includes(photoOptions.limit))) return res.status(400).json({ error: "Invalid photo page" });
    const key = JSON.stringify(identity);
    const pendingKey = `${mode}:${key}:${mode === "photos" ? JSON.stringify(photoOptions) : ""}`;
    if (!pending.has(pendingKey)) {
      if (pending.size >= 8) return res.status(503).json({ error: "Venue information busy" });
      pending.set(pendingKey, load(identity, key, mode, photoOptions).finally(() => pending.delete(pendingKey)));
    }
    res.set("Cache-Control", "no-store");
    return res.json(await pending.get(pendingKey));
  };
  return { services: handler("services"), reviews: handler("reviews"), photos: handler("photos") };
}
module.exports = createVenueServicesHandlers();
module.exports.createVenueServicesHandlers = createVenueServicesHandlers;
