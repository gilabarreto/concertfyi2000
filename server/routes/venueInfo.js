const { request } = require("../http");
const { normalize, nearby } = require("../venueIdentity");
const VENUE_DESCRIPTION = /\b(stadium|arena|venue|theat(?:re|er)|concert hall|music hall|club|auditorium|amphitheat(?:re|er)|arts cent(?:re|er))\b/i;
const safeUrl = value => /^https?:\/\//i.test(value || "") ? value : "";
const claim = (entity, property) => (entity.claims?.[property] || []).filter(item => item.rank !== "deprecated").find(item => item.rank === "preferred")?.mainsnak?.datavalue?.value ?? (entity.claims?.[property] || []).find(item => item.rank !== "deprecated")?.mainsnak?.datavalue?.value;
const year = value => /^\+\d{4}-/.test(value?.time || "") && value.precision >= 9 ? value.time.slice(1, 5) : "";

function createVenueInfoHandler({ fetchJson = request } = {}) {
  const cache = new Map();
  const pending = new Map();
  const fetch = (url, params) => fetchJson(url, { params, headers: { "User-Agent": "ConcertFYI/1.0 (https://concertfyi.com; gilabarreto@gmail.com)" }, signal: AbortSignal.timeout(5000) });

  async function load(name, lat, long) {
    const result = { description: "", wikipediaUrl: "", wikidataUrl: "", officialWebsite: "", address: "", opened: "", coordinates: null, partial: false };
    let entityId;
    // A canonical article distinguishes the present Wembley from Wembley Stadium (1923).
    try {
      const data = await fetch("https://en.wikipedia.org/w/api.php", { action: "query", format: "json", redirects: 1, titles: name, prop: "extracts|pageprops|coordinates", exintro: 1, explaintext: 1, colimit: 1 });
      const page = Object.values(data.query?.pages || {})[0];
      const coords = page?.coordinates?.[0];
      if (page && !page.missing && page.pageprops?.disambiguation == null &&
          normalize(page.title.replace(/ \([^)]*\)$/, "")) === normalize(name) &&
          nearby(lat, long, coords?.lat, coords?.lon) && page.extract) {
        result.description = page.extract;
        result.wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
        result.coordinates = { lat: coords.lat, long: coords.lon };
        entityId = page.pageprops?.wikibase_item;
      }
    } catch { result.partial = true; }

    try {
      let entities;
      if (/^Q\d+$/.test(entityId || "")) {
        const data = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`);
        entities = [data.entities?.[entityId]].filter(Boolean);
      } else {
        const search = await fetch("https://www.wikidata.org/w/api.php", { action: "wbsearchentities", search: name, language: "en", format: "json", limit: 5 });
        const ids = (search.search || []).map(item => item.id).filter(id => /^Q\d+$/.test(id));
        if (!ids.length) return result;
        const data = await fetch("https://www.wikidata.org/w/api.php", { action: "wbgetentities", ids: ids.join("|"), props: "labels|aliases|descriptions|claims|sitelinks", languages: "en", format: "json" });
        entities = Object.values(data.entities || {}).filter(entity => {
          const names = [entity.labels?.en?.value, ...(entity.aliases?.en || []).map(alias => alias.value)];
          return names.some(value => normalize(value) === normalize(name)) && VENUE_DESCRIPTION.test(entity.descriptions?.en?.value || "");
        });
      }
      const matches = entities.filter(entity => {
        const coords = claim(entity, "P625");
        return nearby(lat, long, coords?.latitude, coords?.longitude);
      });
      if (matches.length !== 1) return result;
      const entity = matches[0];
      const coords = claim(entity, "P625");
      result.coordinates = { lat: coords.latitude, long: coords.longitude };
      result.wikidataUrl = `https://www.wikidata.org/wiki/${entity.id}`;
      result.officialWebsite = safeUrl(claim(entity, "P856"));
      result.address = claim(entity, "P6375")?.text || "";
      // Inception can mean start of construction; only an explicit opening date is used.
      result.opened = year(claim(entity, "P1619"));
      if (!result.wikipediaUrl && entity.sitelinks?.enwiki?.title) {
        const title = entity.sitelinks.enwiki.title;
        result.wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
        try {
          const summary = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`);
          if (summary.type !== "disambiguation") result.description = summary.extract || "";
        } catch { result.partial = true; }
      }
    } catch { result.partial = true; }
    return result;
  }

  return async (req, res) => {
    const { name } = req.query;
    const lat = Number(req.query.lat), long = Number(req.query.long);
    if (typeof name !== "string" || !name.trim() || name.length > 200 || req.query.lat == null || req.query.long == null || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(long) || Math.abs(long) > 180) return res.status(400).json({ error: "Missing or invalid name/coordinates" });
    const key = JSON.stringify([name.trim(), lat, long]);
    const cached = cache.get(key);
    let data = cached?.expires > Date.now() ? cached.data : null;
    if (!data) {
      if (!pending.has(key)) {
        if (pending.size >= 8) return res.status(503).json({ error: "Venue information busy" });
        pending.set(key, load(name.trim(), lat, long));
      }
      try {
        data = await pending.get(key);
        if (cache.size >= 200) cache.delete(cache.keys().next().value);
        if (!data.partial) cache.set(key, { data, expires: Date.now() + 24 * 60 * 60 * 1000 });
      } finally { pending.delete(key); }
    }
    res.set("Cache-Control", data.partial ? "no-store" : "public, max-age=86400");
    return res.json(data);
  };
}
module.exports = createVenueInfoHandler();
module.exports.createVenueInfoHandler = createVenueInfoHandler;
