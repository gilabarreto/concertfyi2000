const express = require("express");
const router = express.Router();
const axios = require("axios");

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;

  try {
    // Primeiro, busca com /suggest para pegar as atrações
    const suggestUrl = `${TM_BASE}/suggest`;
    const suggestResponse = await axios.get(suggestUrl, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        keyword,
        segmentId: "KZFzniwnSyZfZ7v7nJ",
      },
      headers: {
        "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
      },
    });

    // Se encontrou alguma atração, busca seus eventos com paginação
    const attractions = suggestResponse.data._embedded?.attractions || [];

    if (attractions.length > 0) {
      const attractionId = attractions[0].id;
      const eventsUrl = `${TM_BASE}/events.json`;

      let allEvents = [];
      let page = 0;
      const pageSize = 20;

      // Busca múltiplas páginas (máximo 5 páginas = 100 eventos)
      for (let i = 0; i < 5; i++) {
        try {
          const eventsResponse = await axios.get(eventsUrl, {
            params: {
              apikey: process.env.TICKETMASTER_API_KEY,
              attractionId,
              size: pageSize,
              page: i,
            },
            headers: {
              "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
            },
          });

          const events = eventsResponse.data._embedded?.events || [];
          if (events.length === 0) break;

          allEvents = allEvents.concat(events);
        } catch (err) {
          break;
        }
      }

      res.json({
        _embedded: {
          events: allEvents,
          attractions: suggestResponse.data._embedded?.attractions || [],
        },
      });
    } else {
      // Se não encontrou atrações, retorna resposta vazia
      res.json({ _embedded: { attractions: [], events: [] } });
    }
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
        size: 50,
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