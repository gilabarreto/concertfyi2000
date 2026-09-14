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
