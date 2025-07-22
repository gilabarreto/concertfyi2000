const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/search", async (req, res) => {
  const { artistName } = req.query;

  try {
    const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artistName)}&p=1`, {
      headers: {
        Accept: "application/json",
        "x-api-key": process.env.SETLISTFM_API_KEY,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Setlist.fm fetch failed" });
  }
});

module.exports = router;
