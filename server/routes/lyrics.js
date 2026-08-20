const fetch = require("node-fetch");
const lyricsFinder = require("lyrics-finder");

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
          return res.json({ lyrics: data.lyrics });
        }
      }
    } catch (err) {
      console.log("lyrics.ovh failed, trying ChartLyrics...");
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
        return res.json({ lyrics: lyricsData.Lyric });
      }
    } catch (err) {
      console.log("ChartLyrics error:", err.message);
    }

    // Fallback to lyrics-finder (includes Genius, AZLyrics, etc)
    try {
      console.log("Trying lyrics-finder...");
      const lyrics = await lyricsFinder(artist, song);

      if (lyrics) {
        return res.json({ lyrics });
      } else {
        throw new Error("No lyrics found");
      }
    } catch (err) {
      console.error("lyrics-finder error:", err.message);
      return res.status(404).json({ error: "Lyrics not found" });
    }
  } catch (err) {
    console.error("Lyrics API error:", err);
    return res.status(500).json({ error: "Failed to fetch lyrics" });
  }
};
