import { getStoredAccessToken } from "./spotifyAuth";

export const createSpotifyPlaylist = async (songs, artistName, tourName, concertDate) => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) throw new Error("Not authenticated with Spotify");

  // Get current user
  const userResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) throw new Error("Failed to get user info");
  const user = await userResponse.json();

  // Format playlist name: Artist + Tour + Date + by ConcertFYI.com
  const playlistName = `${artistName}${tourName ? ` - ${tourName}` : ""} - ${concertDate} by ConcertFYI.com`;
  const playlistDescription = `Setlist from ${artistName} concert at ${concertDate}. Created with ConcertFYI.com`;

  // Create playlist
  const playlistResponse = await fetch(
    `https://api.spotify.com/v1/users/${user.id}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        description: playlistDescription,
        public: true,
      }),
    }
  );

  if (!playlistResponse.ok) throw new Error("Failed to create playlist");
  const playlist = await playlistResponse.json();

  // Search and add songs to playlist
  const uris = [];
  for (const song of songs) {
    try {
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          `${artistName} ${song.name}`
        )}&type=track&limit=1`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.tracks.items.length > 0) {
          uris.push(searchData.tracks.items[0].uri);
        }
      }
    } catch (err) {
      console.error(`Failed to search for ${song.name}:`, err);
    }
  }

  // Add songs in batches (Spotify limits to 100 per request)
  if (uris.length > 0) {
    for (let i = 0; i < uris.length; i += 100) {
      const batch = uris.slice(i, i + 100);
      const addResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: batch }),
        }
      );

      if (!addResponse.ok) {
        throw new Error("Failed to add songs to playlist");
      }
    }
  }

  return playlist;
};
