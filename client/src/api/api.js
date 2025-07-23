import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "https://concertfyi2000.onrender.com";

const API = axios.create({
  baseURL: `${API_BASE}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.token = token;
  }
  return config;
});

export const getSetlist = (artistName) =>
  API.get("/setlist/search", {
    params: { artistName },
  });

export const getTicketmaster = (artistName) =>
  API.get("/ticketmaster/suggest", {
    params: { keyword: artistName },
  });

export const getTicketmasterSuggest = (artist) =>
  API.get("/ticketmaster/suggest", {
    params: { keyword: artist },
  });

export const getLocalEvents = (lat, long) =>
  API.get("/ticketmaster/events", {
    params: { lat, long },
  });



