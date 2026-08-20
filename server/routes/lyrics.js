const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { artist, song } = req.query;

  if (!artist || !song) {
    return res.status(400).json({ error: "Missing artist or song parameter" });
  }

  try {
    // Try lyrics.ovh first
    try {
      const response = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.lyrics) {
          console.log("Found lyrics on lyrics.ovh");
          return res.json({ lyrics: data.lyrics });
        }
      }
    } catch (err) {
      console.log("lyrics.ovh failed, trying next...");
    }

    // Fallback to ChartLyrics
    try {
      const searchResponse = await fetch(
        `https://api.chartlyrics.com/apiv1/searchLyrics?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(song)}`
      );

      if (!searchResponse.ok) throw new Error("ChartLyrics search failed");

      const searchData = await searchResponse.json();

      if (!searchData.Result || searchData.Result.length === 0) {
        throw new Error("No results found");
      }

      // Get the first result
      const lyricId = searchData.Result[0].LyricId;

      const lyricsResponse = await fetch(
        `https://www.chartlyrics.com/api/lyrics/${lyricId}`
      );

      if (!lyricsResponse.ok) throw new Error("Failed to fetch lyrics");

      const lyricsData = await lyricsResponse.json();

      if (lyricsData.Lyric) {
        console.log("Found lyrics on ChartLyrics");
        return res.json({ lyrics: lyricsData.Lyric });
      }
    } catch (err) {
      console.log("ChartLyrics error:", err.message);
    }

    // Fallback to Genius API search (returns URL for now, but more reliable)
    try {
      console.log("Trying Genius...");
      const geniusToken = process.env.GENIUS_ACCESS_TOKEN;

      if (geniusToken) {
        const searchResponse = await fetch(
          `https://api.genius.com/search?q=${encodeURIComponent(`${artist} ${song}`)}`,
          {
            headers: { Authorization: `Bearer ${geniusToken}` },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();

          if (searchData.response?.hits && searchData.response.hits.length > 0) {
            const hit = searchData.response.hits[0];
            console.log(`Found on Genius: ${hit.result.url}`);
            // Return a message that we found it but can't scrape
            // In practice, you'd use Genius as a search indicator
          }
        }
      }
    } catch (err) {
      console.log("Genius error:", err.message);
    }

    // If nothing found, return 404
    return res.status(404).json({ error: "Lyrics not found" });
  } catch (err) {
    console.error("Lyrics API error:", err);
    return res.status(500).json({ error: "Failed to fetch lyrics" });
  }
};
