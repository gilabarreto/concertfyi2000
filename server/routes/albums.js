const { musicbrainzRequest } = require("../musicbrainzClient");

const MBID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMIT = 6;

// Só álbuns de estúdio: o MusicBrainz marca ao vivo, coletânea e afins em secondary-types,
// e o Coldplay sozinho tem ~80 bootlegs ao vivo cadastrados como Album. Sem data não dá
// para ordenar, e na prática é bootleg também.
function studioAlbumsFrom(groups) {
  return groups
    .filter((g) => g["primary-type"] === "Album" && !g["secondary-types"]?.length && g["first-release-date"])
    .sort((a, b) => b["first-release-date"].localeCompare(a["first-release-date"]))
    .slice(0, LIMIT)
    .map((g) => ({ id: g.id, title: g.title, year: g["first-release-date"].slice(0, 4) }));
}

function createAlbumsHandler({ fetchPage = musicbrainzRequest } = {}) {
  return async (req, res) => {
    const { mbid } = req.query;
    if (typeof mbid !== "string" || !MBID_RE.test(mbid)) {
      return res.status(400).json({ error: "Missing or invalid mbid" });
    }
    try {
      // 100 por página é o máximo da API; 3 páginas cobrem discografias com muito bootleg
      // sem prender a fila de 1 req/s por mais de ~3 s.
      const groups = [];
      for (let offset = 0; offset < 300; offset += 100) {
        const page = await fetchPage("release-group", { artist: mbid, type: "album", limit: 100, offset });
        groups.push(...(page["release-groups"] || []));
        if (groups.length >= (page["release-group-count"] || 0)) break;
      }
      res.set("Cache-Control", "public, max-age=86400");
      return res.json({ albums: studioAlbumsFrom(groups) });
    } catch (error) {
      return res.status(error.status === 503 ? 503 : 502).json({ error: "MusicBrainz fetch failed" });
    }
  };
}

module.exports = createAlbumsHandler();
module.exports.createAlbumsHandler = createAlbumsHandler;
module.exports.studioAlbumsFrom = studioAlbumsFrom;
