const express = require("express");
const router = express.Router();
const axios = require("axios");

const headers = () => ({
  Accept: "application/json",
  "x-api-key": process.env.SETLISTFM_API_KEY,
  "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
});

router.get("/search", async (req, res) => {
  const { artistName } = req.query;

  try {
    const response = await axios.get("https://api.setlist.fm/rest/1.0/search/setlists", {
      headers: headers(),
      params: {
        artistName,
        p: 1,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Setlist.fm API error:", error.response?.status, error.message);
    console.error("API Key status:", process.env.SETLISTFM_API_KEY ? "Set" : "Missing");

    res
      .status(error.response?.status || 500)
      .json({
        error: error.response?.data?.message || "Setlist.fm fetch failed",
      });
  }
});

// single setlist, used when a concert page is opened directly (new tab, refresh, shared link)
router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.setlist.fm/rest/1.0/setlist/${encodeURIComponent(req.params.id)}`,
      { headers: headers() }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Setlist.fm API error:", error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ error: "Setlist not found" });
  }
});

module.exports = router;