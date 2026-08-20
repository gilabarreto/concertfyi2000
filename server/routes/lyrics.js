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

    // Fallback to LRCLib API
    try {
      console.log("Trying LRCLib...");
      const lrclibResponse = await fetch(
        `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&song_name=${encodeURIComponent(song)}`
      );

      if (lrclibResponse.ok) {
        const lrclibData = await lrclibResponse.json();

        if (lrclibData.lyrics) {
          console.log("Found lyrics on LRCLib");
          return res.json({ lyrics: lrclibData.lyrics });
        }
      }
    } catch (err) {
      console.log("LRCLib error:", err.message);
    }

    // If nothing found, return 404
    return res.status(404).json({ error: "Lyrics not found" });
  } catch (err) {
    console.error("Lyrics API error:", err);
    return res.status(500).json({ error: "Failed to fetch lyrics" });
  }
};
