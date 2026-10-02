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
