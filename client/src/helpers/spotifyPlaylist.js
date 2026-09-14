import { getStoredAccessToken } from "./spotifyAuth";

// Best-matching Spotify track URI for a song, or null when there is no confident match
export const findTrackUri = async (accessToken, artistName, songName) => {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(`${artistName} ${songName}`)}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    throw Object.assign(new Error("Failed to search track"), { status: response.status });
  }

  const { tracks } = await response.json();
  const artist = artistName.toLowerCase();
  const song = songName.toLowerCase();

  // artist match required (50), then exact name (+40) or name contained in track name (+25)
  const best = tracks.items
    .map((track) => {
      const name = track.name.toLowerCase();
      const artistMatch = track.artists.some((a) => a.name.toLowerCase() === artist);
      const score = artistMatch ? 50 + (name === song ? 40 : name.includes(song) ? 25 : 0) : 0;
      return { track, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  // 70+ = artist match plus a decent name match
  return best?.score >= 70 ? best.track.uri : null;
};

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
  const skippedSongs = [];

  for (const song of songs) {
    try {
      const uri = await findTrackUri(accessToken, artistName, song.name);
      if (uri) uris.push(uri);
      else skippedSongs.push(song.name);
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
