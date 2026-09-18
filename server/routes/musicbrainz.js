const { request } = require("../http");

const MBID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O :artistId da URL já é o mbid (Setlist.fm casa por ele), então não tem busca por
// nome aqui — só o lookup direto. Sem chave, mas o MusicBrainz bloqueia quem não
// manda User-Agent identificável, mesmo aviso do Ticketmaster.
const headers = { "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)" };

module.exports = async (req, res) => {
  const { mbid } = req.query;

  if (typeof mbid !== "string" || !MBID_RE.test(mbid)) {
    return res.status(400).json({ error: "Missing or invalid mbid" });
  }

  try {
    const data = await request(`https://musicbrainz.org/ws/2/artist/${mbid}`, {
      headers,
      params: { fmt: "json", inc: "genres+artist-rels" },
    });
    res.json(data);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: "Artist not found" });
    }
    console.error("MusicBrainz API error:", err.status, err.message);
    res.status(err.status || 500).json({ error: "MusicBrainz fetch failed" });
  }
};
