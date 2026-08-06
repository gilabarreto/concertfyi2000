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

  // Search and add songs to playlist (only exact matches)
  const uris = [];
  const skippedSongs = [];

  for (const song of songs) {
    try {
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          `track:${song.name} artist:${artistName}`
        )}&type=track&limit=5`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();

        // Find exact match: song name matches and artist matches
        const exactMatch = searchData.tracks.items.find(
          (track) =>
            track.name.toLowerCase() === song.name.toLowerCase() &&
            track.artists.some(
              (artist) =>
                artist.name.toLowerCase() === artistName.toLowerCase()
            )
        );

        if (exactMatch) {
          uris.push(exactMatch.uri);
        } else {
          skippedSongs.push(song.name);
          console.log(`Skipped (no exact match): ${song.name}`);
        }
      }
    } catch (err) {
      console.error(`Failed to search for ${song.name}:`, err);
      skippedSongs.push(song.name);
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

  console.log(`Playlist created: ${uris.length}/${songs.length} songs added`);
  if (skippedSongs.length > 0) {
    console.log(`Skipped songs: ${skippedSongs.join(", ")}`);
  }

  return playlist;
};
