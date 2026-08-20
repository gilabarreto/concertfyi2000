const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { artist, song } = req.query;

  if (!artist || !song) {
    return res.status(400).json({ error: "Missing artist or song parameter" });
  }

  try {
    const response = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(song)}`
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Lyrics not found" });
    }

    const data = await response.json();

    if (!data.plainLyrics) {
      return res.status(404).json({ error: "Lyrics not found" });
    }

    return res.json({ lyrics: data.plainLyrics });
  } catch (err) {
    console.error("Lyrics API error:", err);
    return res.status(500).json({ error: "Failed to fetch lyrics" });
  }
};
