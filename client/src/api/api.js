import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "https://concertfyi2000.onrender.com";

const API = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Intercepta para enviar token, se houver
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.token = token;
  }
  return config;
});

export const getFavourites = () => API.get("/favourite")

export const getSetlist = (artistName) =>
  API.get("/setlist/search", {
    params: { artistName },
  });

// 🎟 Ticketmaster
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

export const addFavourite = (artistId, artistName, artistImage) =>
  API.post("/favourite/add", {
    artistId,
    artistName,
    image: artistImage
  })

export const registerUser = (name, email, password) =>
  axios.post("/api/auth/register", { name, email, password })

export const loginUser = (email, password) =>
  axios.post("/api/auth/login", { email, password })

export const deleteFavourite = (artistId) =>
  API.post("/favourite/delete", { artist_id: artistId })



