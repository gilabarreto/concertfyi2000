const express = require("express");
const router = express.Router();
const { request } = require("../http");

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";
const USER_AGENT = "concertfyi2000/1.0.0 (gilabarreto@gmail.com)";
const headers = { "User-Agent": USER_AGENT };

router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;

  try {
    // Primeiro, busca com /suggest para pegar as atrações
    const suggestData = await request(`${TM_BASE}/suggest`, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        keyword,
        segmentId: "KZFzniwnSyZfZ7v7nJ",
      },
      headers,
    });

    // Se encontrou alguma atração, busca seus eventos com paginação
    const attractions = suggestData._embedded?.attractions || [];

    if (attractions.length > 0) {
      const attractionId = attractions[0].id;
      const pageSize = 20;

      let allEvents = [];

      // Busca múltiplas páginas (máximo 5 páginas = 100 eventos)
      for (let i = 0; i < 5; i++) {
        try {
          const eventsData = await request(`${TM_BASE}/events.json`, {
            params: {
              apikey: process.env.TICKETMASTER_API_KEY,
              attractionId,
              size: pageSize,
              page: i,
            },
            headers,
          });

          const events = eventsData._embedded?.events || [];
          if (events.length === 0) break;

          allEvents = allEvents.concat(events);
        } catch (err) {
          break;
        }
      }

      res.json({
        _embedded: {
          events: allEvents,
          attractions,
        },
      });
    } else {
      // Se não encontrou atrações, retorna resposta vazia
      res.json({ _embedded: { attractions: [], events: [] } });
    }
  } catch (error) {
    console.error("Ticketmaster suggest error:", error.message);

    res
      .status(error.status || 500)
      .json({
        error: error.data || "Ticketmaster suggest fetch failed",
      });
  }
});

router.get("/events", async (req, res) => {
  const { lat, long } = req.query;

  try {
    const data = await request(`${TM_BASE}/events.json`, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY,
        latlong: `${lat},${long}`,
        radius: 50,
        unit: "km",
        locale: "*",
        classificationName: "Music",
        size: 50,
      },
      headers,
    });

    res.json(data);
  } catch (error) {
    console.error("Ticketmaster events error:", error.message);

    res
      .status(error.status || 500)
      .json({
        error: error.data || "Ticketmaster events fetch failed",
      });
  }
});

module.exports = router;
