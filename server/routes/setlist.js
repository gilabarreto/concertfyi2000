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

// Every show of one tour, for the Tour Statistics card. setlist.fm pages by 20 and allows
// 2 requests/s, so pages go one at a time with a gap; 5 pages (100 shows) covers most tours.
// ponytail: no server cache, each card view costs up to 5 calls of the daily quota.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.get("/tour", async (req, res) => {
  const { artistMbid, tourName } = req.query;
  if (!MBID.test(artistMbid || "") || typeof tourName !== "string" || !tourName.trim() || tourName.length > 200) {
    return res.status(400).json({ error: "Missing or invalid artistMbid/tourName" });
  }

  let setlist = [];
  let total = 0;
  for (let p = 1; p <= 5; p++) {
    try {
      if (p > 1) await sleep(600);
      const data = await request("https://api.setlist.fm/rest/1.0/search/setlists", {
        headers,
        params: { artistMbid, tourName, p },
      });
      total = data.total || 0;
      setlist = setlist.concat(data.setlist || []);
      if (setlist.length >= total) break;
    } catch (error) {
      // 404 is setlist.fm's "no results"; anything else after page 1 keeps what came.
      if (p === 1 && error.status !== 404) {
        console.error("Setlist.fm API error:", error.status, error.message);
        return res.status(error.status || 500).json({ error: "Setlist.fm fetch failed" });
      }
      break;
    }
  }
  res.json({ total, setlist });
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
