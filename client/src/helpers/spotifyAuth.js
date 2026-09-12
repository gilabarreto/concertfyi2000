const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = ["playlist-modify-public", "playlist-modify-private"];

export const getSpotifyAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
  });
  return `https://accounts.spotify.com/authorize?${params}`;
};

export const getAccessTokenFromCode = async (code) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE}/api/spotify/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri: REDIRECT_URI }),
    }
  );

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

export const isUserAuthenticated = () => {
  return !!getStoredAccessToken();
};
