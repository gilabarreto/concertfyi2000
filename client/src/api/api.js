import axios from "axios";

// dev keeps the base relative so the Vite proxy forwards /api to the local server;
// the build has no proxy, so it needs the absolute host.
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "" : "https://concertfyi2000.onrender.com");

const API = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
});

API.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      error.response
        ? {
            message: error.response.data?.message || "Request failed",
            status: error.response.status,
            data: error.response.data,
          }
        : { message: error.message || "No response received" },
    ),
);

export const getSetlist = (artistName) =>
  API.get("/setlist/search", {
    params: { artistName },
  });

export const getSetlistById = (id) => API.get(`/setlist/${encodeURIComponent(id)}`);

export const getTicketmaster = (artistName) =>
  API.get("/ticketmaster/suggest", {
    params: { keyword: artistName },
  });

export const getLyrics = (artist, song) => API.get("/lyrics", { params: { artist, song } });

export const getYoutubeVideo = (artist, song) => API.get("/youtube", { params: { artist, song } });

// Photon (OpenStreetMap) city autocomplete: public, no key, CORS-enabled
export const searchCities = (q) =>
  axios.get("https://photon.komoot.io/api/", {
    params: { q, limit: 8, lang: "en", layer: "city" },
    timeout: 10000,
  });

export const getLocalEvents = (lat, long) =>
  API.get("/ticketmaster/events", {
    params: { lat, long },
  });
