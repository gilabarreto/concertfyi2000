const express = require("express");
const router = express.Router();
const axios = require("axios");

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;

  try {
    const url = `${TM_BASE}/suggest`;

    const response = await axios.get(url, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        keyword,
        segmentId: "KZFzniwnSyZfZ7v7nJ",
        sort: "name,asc",
      },
      headers: {
        "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Ticketmaster suggest error:", error.message);

    res
      .status(error.response?.status || 500)
      .json({
        error: error.response?.data || "Ticketmaster suggest fetch failed",
      });
  }
});

router.get("/events", async (req, res) => {
  const { lat, long } = req.query;

  try {
    const url = `${TM_BASE}/events.json`;

    const response = await axios.get(url, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        latlong: `${lat},${long}`,
        radius: 50,
        unit: "km",
        locale: "*",
        classificationName: "Music",
      },
      headers: {
        "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Ticketmaster events error:", error.message);

    res
      .status(error.response?.status || 500)
      .json({
        error: error.response?.data || "Ticketmaster events fetch failed",
      });
  }
});

module.exports = router;