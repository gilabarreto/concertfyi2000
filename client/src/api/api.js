import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "https://concertfyi2000.onrender.com";

const API = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000, // 10 segundos de timeout
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.token = token;
  }
  return config;
});

// Adicionando interceptador para erros
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erros 4xx/5xx
      return Promise.reject({
        message: error.response.data?.message || "Request failed",
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request foi feita mas não houve resposta
      return Promise.reject({
        message: "No response received",
        isOffline: true,
      });
    } else {
      // Erro ao configurar a request
      return Promise.reject({
        message: error.message,
      });
    }
  }
);

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



