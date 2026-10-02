const express = require("express");
const router = express.Router();
const { request } = require("../http");

// index.js loads dotenv before requiring the routes, so env is set by now
const headers = {
  Accept: "application/json",
  "x-api-key": process.env.SETLISTFM_API_KEY,
  "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
};

router.get("/search", async (req, res) => {
  const { artistName } = req.query;

  // O `request` descarta parâmetro undefined, então uma busca sem nome ia para a
  // setlist.fm sem filtro nenhum e voltava com a lista inteira do mundo.
  if (typeof artistName !== "string" || !artistName.trim() || artistName.length > 200) {
    return res.status(400).json({ error: "Missing or invalid artistName" });
  }

  try {
    const data = await request("https://api.setlist.fm/rest/1.0/search/setlists", {
      headers,
      params: {
        artistName,
        p: 1,
      },
    });

    res.json(data);
  } catch (error) {
    console.error("Setlist.fm API error:", error.status, error.message);
    console.error("API Key status:", process.env.SETLISTFM_API_KEY ? "Set" : "Missing");

    res
      .status(error.status || 500)
      .json({
        error: error.data?.message || "Setlist.fm fetch failed",
      });
  }
});

// Exact list for one artist. The name search above also returns other artists whose name
// matches (1966 vs 1624 shows for Foo Fighters), which the client then filters out — so a
// page of 20 arrived with fewer than 20 shows of the right artist.
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/artist/:mbid", async (req, res) => {
  if (!MBID.test(req.params.mbid)) {
    return res.status(400).json({ error: "Invalid artist mbid" });
  }

  try {
    const data = await request(
      `https://api.setlist.fm/rest/1.0/artist/${req.params.mbid}/setlists`,
      { headers, params: { p: 1 } }
    );
    res.json(data);
  } catch (error) {
    console.error("Setlist.fm API error:", error.status, error.message);
    res.status(error.status || 500).json({ error: "Setlist.fm fetch failed" });
  }
});

// setlist.fm pages by 20 and allows 2 requests/s, so pages go one at a time with a gap.
// A 404 on page 1 is setlist.fm's "no results". A failure after page 1 keeps what came but
// says so: a 429 on page 2 would otherwise read as a 34-show tour that only had 20.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function allPages(url, params, maxPages) {
  let setlist = [];
  let total = 0;
  let partial = false;
  for (let p = 1; p <= maxPages; p++) {
    try {
      if (p > 1) await sleep(600);
      const data = await request(url, { headers, params: { ...params, p } });
      total = data.total || 0;
      setlist = setlist.concat(data.setlist || []);
      if (setlist.length >= total) break;
    } catch (error) {
      if (p === 1 && error.status !== 404) throw error;
      if (p > 1) {
        console.error(`Setlist.fm page ${p} failed (${error.status || error.message}), returning ${setlist.length} of ${total}`);
        partial = true;
      }
      break;
    }
  }
  return { total, setlist, partial };
}

// Every route below answers the same for every visitor (a tour, a venue, a city), and Home
// alone fires two of them per visit, so one copy per query is kept for 30 min. The promise
// is what's stored, so concurrent visitors share one fetch.
// ponytail: in-memory, per instance and lost on restart; fine for one Render instance.
const PAGE_TTL = 30 * 60 * 1000;
const pageCache = new Map();

function cachedPages(url, params, maxPages) {
  const key = JSON.stringify([url, params, maxPages]);
  const hit = pageCache.get(key);
  if (hit?.expires > Date.now()) return hit.promise;
  const promise = allPages(url, params, maxPages);
  if (pageCache.size >= 200) pageCache.delete(pageCache.keys().next().value);
  pageCache.set(key, { promise, expires: Date.now() + PAGE_TTL });
  // A partial answer isn't kept either: the next visitor gets a fresh try at every page.
  promise.then((data) => data.partial && pageCache.delete(key), () => pageCache.delete(key));
  return promise;
}

const sendPages = async (res, url, params, maxPages) => {
  try {
    res.json(await cachedPages(url, params, maxPages));
  } catch (error) {
    console.error("Setlist.fm API error:", error.status, error.message);
    res.status(error.status || 500).json({ error: "Setlist.fm fetch failed" });
  }
};

// Every show of one tour, for the Tour Statistics card; 5 pages (100 shows) covers most tours.
router.get("/tour", (req, res) => {
  const { artistMbid, tourName } = req.query;
  if (!MBID.test(artistMbid || "") || typeof tourName !== "string" || !tourName.trim() || tourName.length > 200) {
    return res.status(400).json({ error: "Missing or invalid artistMbid/tourName" });
  }
  sendPages(res, "https://api.setlist.fm/rest/1.0/search/setlists", { artistMbid, tourName }, 5);
});

// Venue page header: the venue on its own (name, city, coords), without its setlists.
router.get("/venue-details/:venueId", async (req, res) => {
  if (!/^[0-9a-f]{6,10}$/i.test(req.params.venueId)) return res.status(400).json({ error: "Invalid venue id" });
  try {
    const venue = await request(`https://api.setlist.fm/rest/1.0/venue/${req.params.venueId}`, { headers, signal: AbortSignal.timeout(5000) });
    res.json(venue);
  } catch (error) {
    res.status(error.status === 404 ? 404 : 502).json({ error: "Venue fetch failed" });
  }
});

// Venue page. Newest first and future dates included, so on a busy venue (a festival
// lineup is one setlist per act) page 1 can be all upcoming — 3 pages leave room for the past.
router.get("/venue/:venueId", (req, res) => {
  if (!/^[0-9a-f]{6,10}$/i.test(req.params.venueId)) {
    return res.status(400).json({ error: "Invalid venue id" });
  }
  sendPages(res, `https://api.setlist.fm/rest/1.0/venue/${req.params.venueId}/setlists`, {}, 3);
});

// My City page: this year's setlists in one city, any artist. countryCode is optional
// (geolocation only knows the country's name) and keeps same-named cities apart.
router.get("/city", (req, res) => {
  const { cityName, countryCode } = req.query;
  const year = Number(req.query.year);
  if (typeof cityName !== "string" || !cityName.trim() || cityName.length > 200 ||
      !Number.isInteger(year) || year < 1900 || year > 2100 ||
      (countryCode !== undefined && !/^[a-z]{2}$/i.test(countryCode))) {
    return res.status(400).json({ error: "Missing or invalid cityName/year/countryCode" });
  }
  sendPages(res, "https://api.setlist.fm/rest/1.0/search/setlists", { cityName, countryCode, year }, 3);
});

// Recent local entries include empty setlists: a future date is enough to list a show.
router.get("/recent", (req, res) => {
  const { cityName, countryCode } = req.query;
  if (typeof cityName !== "string" || !cityName.trim() || cityName.length > 200 ||
      (countryCode !== undefined && !/^[a-z]{2}$/i.test(countryCode))) {
    return res.status(400).json({ error: "Missing or invalid cityName/countryCode" });
  }
  // Whole days only: a timestamp to the second would make every request a new cache key.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const lastUpdated = `${since.toISOString().slice(0, 10).replace(/-/g, "")}000000`;
  sendPages(res, "https://api.setlist.fm/rest/1.0/search/setlists", { cityName, countryCode, lastUpdated }, 3);
});

// single setlist, used when a concert page is opened directly (new tab, refresh, shared link)
router.get("/:id", async (req, res) => {
  try {
    const data = await request(
      `https://api.setlist.fm/rest/1.0/setlist/${encodeURIComponent(req.params.id)}`,
      { headers }
    );
    res.json(data);
  } catch (error) {
    console.error("Setlist.fm API error:", error.status, error.message);
    res.status(error.status || 500).json({ error: "Setlist not found" });
  }
});

module.exports = router;
