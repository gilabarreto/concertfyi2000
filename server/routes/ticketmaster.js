const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;

  try {
    const url = `${TM_BASE}/suggest?apikey=${process.env.TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(keyword)}&segmentId=KZFzniwnSyZfZ7v7nJ&sort=name,asc`;

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Ticketmaster suggest fetch failed" });
  }
});

router.get("/events", async (req, res) => {
  const { lat, long } = req.query;

  try {
    const url = `${TM_BASE}/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&latlong=${lat},${long}&radius=50&unit=km&locale=*&classificationName=Music`;

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Ticketmaster events fetch failed" });
  }
});

module.exports = router;
