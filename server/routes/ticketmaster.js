const express = require("express");
const router = express.Router();
const { request } = require("../http");
const { findTicketmasterVenue, leadingWords } = require("../venueIdentity");

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";
const headers = { "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)" };

// Nome de artista mais longo que isto não existe; o limite está aqui para a fronteira
// ter um formato definido, não para caber algum nome específico.
const MAX_TERM = 200;

router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;

  if (typeof keyword !== "string" || !keyword.trim() || keyword.length > MAX_TERM) {
    return res.status(400).json({ error: "Missing or invalid keyword" });
  }

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
          // Parar é certo — o que já veio serve. Mudo não: um 429 na página 2 sai
          // daqui como um 200 com 20 eventos, igualzinho a um artista que só tem 20.
          console.error(
            `Ticketmaster page ${i} failed (${err.status || err.message}), returning ${allEvents.length} events so far`
          );
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
  const lat = Number(req.query.lat);
  const long = Number(req.query.long);

  // Sem isto, um pedido sem coordenada virava `latlong=undefined,undefined` e gastava
  // uma chamada da cota para receber erro da Ticketmaster.
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(long) || Math.abs(long) > 180) {
    return res.status(400).json({ error: "Missing or invalid lat/long" });
  }

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
        includeTBA: "no",
        includeTBD: "no",
        sort: "date,asc",
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

// Venue page, upcoming side. setlist.fm and Ticketmaster don't share venue ids, so the
// venue is looked up by name within a few km of setlist.fm's coordinates (the city's, not
// the building's) — same fragile seam as the artist name. No match is an empty list.
router.get("/venue-events", async (req, res) => {
  const { name } = req.query;
  const lat = Number(req.query.lat);
  const long = Number(req.query.long);
  if (typeof name !== "string" || !name.trim() || name.length > MAX_TERM ||
      !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(long) || Math.abs(long) > 180) {
    return res.status(400).json({ error: "Missing or invalid name/lat/long" });
  }

  try {
    const search = async keyword => (await request(`${TM_BASE}/venues.json`, {
      params: { apikey: process.env.TICKETMASTER_API_KEY, keyword, latlong: `${lat},${long}`, radius: 50, unit: "km", size: 5 },
      headers,
    }))._embedded?.venues;
    let venue = findTicketmasterVenue(await search(name), name, lat, long);
    // A resort's stage is filed under its own name ("Grey Eagle Resort & Casino" is Ticketmaster's
    // "Grey Eagle Event Centre"): one more search by the first two words, one nearby hit or none.
    const lead = leadingWords(name);
    if (!venue && lead) venue = findTicketmasterVenue(await search(lead), name, lat, long, true);
    if (!venue) return res.json({ venue: null, events: [] });

    const data = await request(`${TM_BASE}/events.json`, {
      params: { apikey: process.env.TICKETMASTER_API_KEY, venueId: venue.id, classificationName: "Music", sort: "date,asc", size: 50 },
      headers,
    }).catch(error => {
      console.error("Ticketmaster venue events unavailable:", error.status || error.message);
      return { _embedded: { events: [] } };
    });
    res.json({ venue, events: data._embedded?.events || [] });
  } catch (error) {
    console.error("Ticketmaster venue error:", error.message);
    res.status(error.status || 500).json({ error: error.data || "Ticketmaster venue fetch failed" });
  }
});

module.exports = router;
