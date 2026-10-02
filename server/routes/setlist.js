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
// A 404 on page 1 is setlist.fm's "no results"; any failure after page 1 keeps what came.
// ponytail: no server cache, each call here costs up to `maxPages` of the daily quota.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function allPages(url, params, maxPages) {
  let setlist = [];
  let total = 0;
  for (let p = 1; p <= maxPages; p++) {
    try {
      if (p > 1) await sleep(600);
      const data = await request(url, { headers, params: { ...params, p } });
      total = data.total || 0;
      setlist = setlist.concat(data.setlist || []);
      if (setlist.length >= total) break;
    } catch (error) {
      if (p === 1 && error.status !== 404) throw error;
      break;
    }
  }
  return { total, setlist };
}

const sendPages = async (res, url, params, maxPages) => {
  try {
    res.json(await allPages(url, params, maxPages));
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

// Home's Recently Added: setlists from yesterday's shows that people have already filled
// in. The global lastUpdated feed alone is sorted by show date, so its first pages are all
// empty future shows; pinning date to yesterday leaves about half with songs. Same answer
// for every visitor, so one copy is kept for 30 min instead of 2 calls per Home view.
// ponytail: in-memory, lost on restart and per instance; fine for one Render instance.
let recent = { key: null, at: 0, data: null };

router.get("/recent", async (req, res) => {
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const [d, m, y] = [pad(day.getUTCDate()), pad(day.getUTCMonth() + 1), day.getUTCFullYear()];
  const key = `${d}-${m}-${y}`;

  if (recent.key !== key || Date.now() - recent.at > 30 * 60 * 1000) {
    try {
      const { setlist } = await allPages(
        "https://api.setlist.fm/rest/1.0/search/setlists",
        { date: key, lastUpdated: `${y}${m}${d}000000` },
        2
      );
      const filled = setlist
        .filter((show) => show.sets?.set?.length)
        .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
      recent = { key, at: Date.now(), data: { setlist: filled } };
    } catch (error) {
      console.error("Setlist.fm API error:", error.status, error.message);
      if (!recent.data) return res.status(error.status || 500).json({ error: "Setlist.fm fetch failed" });
    }
  }
  res.json(recent.data);
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
