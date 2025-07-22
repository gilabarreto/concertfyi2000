import axios from "axios"

const API = axios.create({
  baseURL: "/api",
})

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.token = token
  }
  return config
})

export const getFavourites = () => API.get("/favourite")

export const getSetlist = (artistName) =>
  axios.get(`${import.meta.env.VITE_API_BASE}/api/setlist/search`, {
    params: { artistName },
  });


export const getTicketmaster = (artistName) =>
  axios.get(`${import.meta.env.VITE_API_BASE}/api/ticketmaster/suggest`, {
    params: { keyword: artistName },
  });


export const getTicketmasterSuggest = (artist) =>
  axios.get("/ticketmaster/discovery/v2/suggest", {
    params: {
      keyword: artist,
      segmentId: "KZFzniwnSyZfZ7v7nJ",
      sort: "name,asc",
      apikey: import.meta.env.VITE_TICKETMASTER_KEY,
    },
  })

export const getLocalEvents = (lat, long) =>
  axios.get(`${import.meta.env.VITE_API_BASE}/api/ticketmaster/events`, {
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



