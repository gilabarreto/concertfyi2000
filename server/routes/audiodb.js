const { request } = require("../http");

const MBID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AUDIODB_BASE = "https://www.theaudiodb.com/api/v1/json/123/artist-mb.php";
const IMAGE_FIELDS = [
  ["strArtistThumb", "Artist portrait"],
  ["strArtistFanart", "Artist photo"],
  ["strArtistFanart2", "Artist photo"],
  ["strArtistFanart3", "Artist photo"],
  ["strArtistFanart4", "Artist photo"],
  ["strArtistFanart5", "Artist photo"],
  ["strArtistWideThumb", "Artist photo"],
];

const validImageUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "r2.theaudiodb.com" ? url.href : null;
  } catch {
    return null;
  }
};

function artistImagesFrom(data, expectedMbid) {
  const artist = data?.artists?.[0];
  if (!artist || artist.strMusicBrainzID?.toLowerCase() !== expectedMbid?.toLowerCase()) {
    return { artistName: "", artistId: "", sourceUrl: "https://www.theaudiodb.com/", images: [] };
  }
  const seen = new Set();
  const images = IMAGE_FIELDS.flatMap(([field, label]) => {
    const imageUrl = validImageUrl(artist[field]);
    if (!imageUrl || seen.has(imageUrl)) return [];
    seen.add(imageUrl);
    return [{ imageUrl, label }];
  });
  const id = /^\d+$/.test(String(artist.idArtist || "")) ? artist.idArtist : "";
  return {
    artistName: typeof artist.strArtist === "string" ? artist.strArtist : "",
    artistId: id,
    sourceUrl: id ? `https://www.theaudiodb.com/artist/${id}` : "https://www.theaudiodb.com/",
    profile: {
      biography: artist.strBiographyEN || "",
      country: artist.strCountry || "",
      genre: artist.strGenre || "",
      style: artist.strStyle || "",
      mood: artist.strMood || "",
      formedYear: artist.intFormedYear || "",
      disbandedYear: artist.intDiedYear || "",
      members: artist.strMembers || "",
      website: artist.strWebsite || "",
    },
    images,
  };
}

function createArtistImagesHandler({ fetchArtist = request } = {}) {
  const cache = new Map();
  const pending = new Map();
  return async (req, res) => {
    const { mbid } = req.query;
    if (typeof mbid !== "string" || !MBID_RE.test(mbid)) {
      return res.status(400).json({ error: "Missing or invalid mbid" });
    }
    const key = mbid.toLowerCase();
    try {
      let result = cache.get(key);
      if (!result) {
        if (!pending.has(key)) {
          const task = fetchArtist(AUDIODB_BASE, { params: { i: mbid } })
            .then((data) => artistImagesFrom(data, mbid))
            .then((response) => {
              if (cache.size >= 200) cache.delete(cache.keys().next().value);
              cache.set(key, response);
              return response;
            })
            .finally(() => pending.delete(key));
          pending.set(key, task);
        }
        result = await pending.get(key);
      }
      res.set("Cache-Control", "public, max-age=86400");
      return res.json(result);
    } catch (err) {
      console.error("TheAudioDB artist lookup failed:", err.status || err.name);
      return res.status(503).json({ error: "Artist image lookup temporarily unavailable" });
    }
  };
}

module.exports = createArtistImagesHandler();
module.exports.createArtistImagesHandler = createArtistImagesHandler;

module.exports.artistImagesFrom = artistImagesFrom;
