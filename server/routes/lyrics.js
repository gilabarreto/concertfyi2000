const { request } = require("../http");

module.exports = async (req, res) => {
  const { artist, song } = req.query;

  if (!artist || !song) {
    return res.status(400).json({ error: "Missing artist or song parameter" });
  }

  try {
    const data = await request("https://lrclib.net/api/get", {
      params: { artist_name: artist, track_name: song },
    });

    if (!data.plainLyrics) {
      return res.status(404).json({ error: "Lyrics not found" });
    }

    return res.json({ lyrics: data.plainLyrics });
  } catch (err) {
    // 404 do lrclib é resposta normal: a música não está no catálogo, não é falha
    // nossa. Qualquer outro status é, e antes virava 404 junto — escondendo o lrclib
    // fora do ar atrás de "sem letra".
    if (err.status === 404) {
      return res.status(404).json({ error: "Lyrics not found" });
    }
    console.error("Lyrics API error:", err.message);
    return res.status(500).json({ error: "Failed to fetch lyrics" });
  }
};
