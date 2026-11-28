const { request } = require("../http");

// Caixa, acento e pontuação fora: o setlist.fm escreve "Dont Look Back in Anger" e o
// LRCLIB "Don't Look Back In Anger".
const normalize = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// O /api/get exige o nome exato. Sem par, o /api/search acha a grafia do LRCLIB, mas só
// vale um resultado com o mesmo artista e a mesma música depois de normalizar — nunca o
// "mais parecido", que traria a letra de outra música.
async function searchLyrics(artist, song) {
  const results = await request("https://lrclib.net/api/search", {
    params: { artist_name: artist, track_name: song },
  });
  const match = (Array.isArray(results) ? results : []).find(
    (r) =>
      r.plainLyrics &&
      normalize(r.artistName) === normalize(artist) &&
      normalize(r.trackName) === normalize(song),
  );
  return match?.plainLyrics || "";
}

module.exports = async (req, res) => {
  const { artist, song } = req.query;

  if (!artist || !song) {
    return res.status(400).json({ error: "Missing artist or song parameter" });
  }

  try {
    const data = await request("https://lrclib.net/api/get", {
      params: { artist_name: artist, track_name: song },
    }).catch((err) => {
      if (err.status === 404) return {};
      throw err;
    });
    const lyrics = data.plainLyrics || (await searchLyrics(artist, song));

    if (!lyrics) {
      return res.status(404).json({ error: "Lyrics not found" });
    }

    return res.json({ lyrics });
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
