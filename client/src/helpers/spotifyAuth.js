import { API_BASE } from "../api/api";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = ["playlist-modify-public", "playlist-modify-private"];

const getSpotifyAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
  });
  return `https://accounts.spotify.com/authorize?${params}`;
};

// Dois lugares abrem este popup: "conectar para ouvir" e "criar playlist". Centralizar
// pela janela (screenX/outerWidth) e não pela tela é o que mantém o popup no monitor certo.
export const openSpotifyAuthPopup = () => {
  const width = 420;
  const height = 320;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  return window.open(
    getSpotifyAuthUrl(),
    "spotify_auth",
    `width=${width},height=${height},left=${left},top=${top}`,
  );
};

export const getAccessTokenFromCode = async (code) => {
  const response = await fetch(`${API_BASE}/api/spotify/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri: REDIRECT_URI }),
  });

  if (!response.ok) throw new Error("Failed to get access token");
  const data = await response.json();
  return data.access_token;
};

export const getStoredAccessToken = () => {
  return localStorage.getItem("spotify_access_token");
};

export const saveAccessToken = (token) => {
  localStorage.setItem("spotify_access_token", token);
};

export const clearAccessToken = () => {
  localStorage.removeItem("spotify_access_token");
};
