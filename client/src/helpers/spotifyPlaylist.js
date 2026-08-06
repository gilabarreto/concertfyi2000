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
  const skippedSongs = [];

  for (const song of songs) {
    try {
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          `${artistName} ${song.name}`
        )}&type=track&limit=10`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();

        if (searchData.tracks.items.length === 0) {
          skippedSongs.push(song.name);
          console.log(`Skipped (not found): ${song.name}`);
          continue;
        }

        // Score tracks: prioritize artist match + name similarity
        const scoredTracks = searchData.tracks.items.map((track) => {
          let score = 0;

          // Artist match is most important (50 points)
          if (
            track.artists.some(
              (artist) =>
                artist.name.toLowerCase() === artistName.toLowerCase()
            )
          ) {
            score += 50;
          }

          // Exact name match (40 points)
          if (track.name.toLowerCase() === song.name.toLowerCase()) {
            score += 40;
          }
          // Partial name match (20 points)
          else if (track.name.toLowerCase().includes(song.name.toLowerCase())) {
            score += 20;
          }

          return { track, score };
        });

        // Get best match
        const bestMatch = scoredTracks.sort((a, b) => b.score - a.score)[0];

        // Only add if has decent score (artist match is 50 points, so 50+ means artist matched)
        if (bestMatch.score >= 50) {
          uris.push(bestMatch.track.uri);
          console.log(
            `Added: ${song.name} (match score: ${bestMatch.score})`
          );
        } else {
          skippedSongs.push(song.name);
          console.log(
            `Skipped (low confidence): ${song.name} (score: ${bestMatch.score})`
          );
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
