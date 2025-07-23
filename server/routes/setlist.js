const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/search", async (req, res) => {
  const { artistName } = req.query;

  try {
    const response = await axios.get("https://api.setlist.fm/rest/1.0/search/setlists", {
      headers: {
        Accept: "application/json",
        "x-api-key": process.env.SETLISTFM_API_KEY,
        "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
      },
      params: { artistName, p: 1 },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Axios error:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data?.message || "Setlist.fm fetch failed" });
  }
});

module.exports = router;
