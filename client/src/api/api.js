import { request } from "./request";

// dev keeps the base relative so the Vite proxy forwards /api to the local server;
// the build has no proxy, so it needs the absolute host.
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "" : "https://concertfyi2000.onrender.com");

const API = (path, options) => request(`${API_BASE}/api${path}`, options);

export const getSetlist = (artistName) => API("/setlist/search", { params: { artistName } });

export const getSetlistById = (id) => API(`/setlist/${encodeURIComponent(id)}`);

export const getTicketmaster = (artistName) =>
  API("/ticketmaster/suggest", { params: { keyword: artistName } });

export const getLyrics = (artist, song) => API("/lyrics", { params: { artist, song } });

export const getYoutubeVideo = (artist, song) => API("/youtube", { params: { artist, song } });

// Photon (OpenStreetMap) city autocomplete: public, no key, CORS-enabled.
// Não passa pelo proxy — é a única chamada do client direto a terceiro.
export const searchCities = (q) =>
  request("https://photon.komoot.io/api/", {
    params: { q, limit: 8, lang: "en", layer: "city" },
  });

export const getLocalEvents = (lat, long) => API("/ticketmaster/events", { params: { lat, long } });

// Biography uses the artist name to resolve the Wikipedia summary.
export const getArtistBackground = (artist) =>
  API("/wikipedia", { params: { artist }, timeout: 30000 });

export const getEventArt = (params) => API("/event-art", { params, timeout: 20000 });

export const getArtistImages = (mbid) => API("/audiodb/artist-images", { params: { mbid } });

export const getApiLabData = (source) => API("/api-lab", { params: { source }, timeout: 60000 });
