const { musicbrainzRequest } = require("../musicbrainzClient");
const { createStore } = require("../store");

const MBID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Só a página de artista: o client cola "/embed" nela e põe num iframe.
const SPOTIFY_RE = /^https:\/\/open\.spotify\.com\/artist\/[A-Za-z0-9]+$/;

// Link do Spotify para quando a Ticketmaster não traz um: a relação de URL do artista no
// MusicBrainz (CC0, pode ficar guardada). Sem relação, responde "" — também guardado, porque
// a pergunta só muda quando alguém edita o MusicBrainz.
function spotifyFrom(artist) {
  return (
    (artist.relations || []).map((r) => r.url?.resource).find((url) => SPOTIFY_RE.test(url)) || ""
  );
}

const TTL = 30 * 24 * 60 * 60;

function createArtistSpotifyHandler({
  fetchArtist = musicbrainzRequest,
  memoryStore = createStore(),
} = {}) {
  return async (req, res) => {
    const { mbid } = req.query;
    if (typeof mbid !== "string" || !MBID_RE.test(mbid)) {
      return res.status(400).json({ error: "Missing or invalid mbid" });
    }
    const store = req.app?.locals?.store || memoryStore;
    try {
      const spotify = await store.cached(`spotify:${mbid.toLowerCase()}`, TTL, async () =>
        spotifyFrom(await fetchArtist(`artist/${mbid}`, { inc: "url-rels" })),
      );
      res.set("Cache-Control", "public, max-age=86400");
      return res.json({ spotify });
    } catch (error) {
      return res
        .status(error.status === 503 ? 503 : 502)
        .json({ error: "MusicBrainz fetch failed" });
    }
  };
}

module.exports = createArtistSpotifyHandler();
module.exports.createArtistSpotifyHandler = createArtistSpotifyHandler;
module.exports.spotifyFrom = spotifyFrom;
