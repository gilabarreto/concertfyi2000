const { request } = require("../http");
const { musicbrainzRequest } = require("../musicbrainzClient");

const MBID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const normalize = (value) => (value || "").normalize("NFD").replace(/\p{M}/gu, "")
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function sameVenue(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  if (left === right) return true;
  // Handles e.g. "Stadiwm Principality Stadium" vs "Principality Stadium";
  // a single generic word such as "Arena" is never sufficient.
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  return shorter.split(" ").length >= 2 && (` ${longer} `).includes(` ${shorter} `);
}

function matchEvent(events, { mbid, date, venue, city }) {
  const matches = events.filter((event) => {
    const span = event["life-span"];
    if (event.cancelled || span?.begin !== date || (span.end && span.end !== date)) return false;
    const relations = event.relations || [];
    const performer = relations.some((r) => r.artist?.id?.toLowerCase() === mbid.toLowerCase()
      && /performer|dj/i.test(r.type || ""));
    const place = relations.some((r) => r.type === "held at" && sameVenue(r.place?.name, venue)
      && (!city || !r.place?.area?.name || normalize(r.place.area.name) === normalize(city)));
    return performer && place;
  });
  // Two performances on the same day/venue cannot be distinguished by the setlist date.
  return matches.length === 1 ? matches[0] : null;
}

function posterFromArchive(data, event) {
  const images = data?.images;
  if (!Array.isArray(images)) throw new Error("Invalid Event Art Archive response");
  const image = images.find((item) => item.approved === true && item.types?.includes("Poster"));
  if (!image || !/^\d+$/.test(String(image.id))) return null;
  // Construct a known archive endpoint rather than accepting arbitrary image hosts.
  return {
    kind: "event-poster",
    imageUrl: `https://eventartarchive.org/event/${event.id}/${image.id}-500.jpg`,
    sourceUrl: `https://musicbrainz.org/event/${event.id}/event-art`,
    source: "Event Art Archive",
    eventName: event.name,
    eventId: event.id,
  };
}

function validInput({ mbid, date, venue, city }) {
  if (typeof mbid !== "string" || !MBID_RE.test(mbid)) return false;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  return typeof venue === "string" && venue.trim().length > 0 && venue.length <= 200
    && (city === undefined || (typeof city === "string" && city.length <= 200));
}

function createEventArtHandler({ search = musicbrainzRequest, fetchArchive = request } = {}) {
  const cache = new Map();
  const pending = new Map();
  return async (req, res) => {
    if (!validInput(req.query)) return res.status(400).json({ error: "Invalid artist, date or venue" });
    const { mbid, date, venue, city } = req.query;
    const key = JSON.stringify([mbid.toLowerCase(), date, normalize(venue), normalize(city)]);
    try {
      let cached = cache.get(key);
      if (!cached || cached.expires <= Date.now()) {
        if (!pending.has(key)) {
          if (pending.size >= 8) return res.status(503).json({ error: "Artwork lookup busy" });
          const task = (async () => {
            const result = await search("event/", { query: `arid:${mbid} AND begin:${date}`, limit: 25 });
            if (!Array.isArray(result.events)) throw new Error("Invalid event search response");
            // Don't guess if the candidate list is truncated.
            const event = result.count > result.events.length ? null : matchEvent(result.events, req.query);
            let artwork = null;
            if (event && MBID_RE.test(event.id)) {
              try {
                const data = await fetchArchive(`https://eventartarchive.org/event/${event.id}/`, {
                  signal: AbortSignal.timeout(5000),
                });
                artwork = posterFromArchive(data, event);
              } catch (err) {
                if (err.status !== 404) throw err;
              }
            }
            const entry = { body: { artwork }, expires: Date.now() + (artwork ? 86400000 : 3600000) };
            if (cache.size >= 200) cache.delete(cache.keys().next().value);
            cache.set(key, entry);
            return entry;
          })().finally(() => pending.delete(key));
          pending.set(key, task);
        }
        cached = await pending.get(key);
      }
      res.set("Cache-Control", "public, max-age=3600");
      return res.json(cached.body);
    } catch (err) {
      console.error("Event artwork lookup failed:", err.status || err.name);
      return res.status(503).json({ error: "Artwork lookup temporarily unavailable" });
    }
  };
}

module.exports = createEventArtHandler();
module.exports.createEventArtHandler = createEventArtHandler;
module.exports.matchEvent = matchEvent;
module.exports.sameVenue = sameVenue;
