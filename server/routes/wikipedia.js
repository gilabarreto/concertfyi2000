const { request } = require("../http");

// Reject disambiguation pages and non-musical namesakes (e.g. Phoenix the city).
const MUSIC_DESCRIPTION = /\b(band|singer|musician|rapper|songwriter|musical|music duo|music group|DJ|disc jockey|composer|record producer|rock duo|pop duo)\b/i;

function createWikipediaHandler({ fetchJson = request } = {}) {
  return async (req, res) => {
    const artist = req.query.artist;
    if (typeof artist !== "string" || !artist.trim() || artist.length > 200) {
      return res.status(400).json({ error: "Missing or invalid artist" });
    }
    const name = artist.trim();
    try {
      for (const suffix of ["", " (band)", " (musician)", " (singer)", " (rapper)"]) {
        const title = (name + suffix).replace(/ /g, "_");
        let data;
        try {
          data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
            headers: { "User-Agent": "ConcertFYI/1.0 (https://concertfyi.com; gilabarreto@gmail.com)" },
            signal: AbortSignal.timeout(5000),
          });
        } catch (error) {
          if (error.status === 404) continue;
          throw error;
        }
        if (data?.type === "disambiguation" || !MUSIC_DESCRIPTION.test(data?.description || "") || !data?.extract) continue;
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent((data.title || name).replace(/ /g, "_"))}`;
        res.set("Cache-Control", "public, max-age=86400");
        return res.json({ title: data.title, description: data.description, extract: data.extract, imageUrl: /^https:\/\/upload\.wikimedia\.org\//.test(data.originalimage?.source || data.thumbnail?.source || "") ? (data.originalimage?.source || data.thumbnail?.source) : "", pageUrl });
      }
      res.set("Cache-Control", "public, max-age=3600");
      return res.json({ extract: "", pageUrl: "" });
    } catch (error) {
      return res.status(error.status === 429 ? 429 : 502).json({ error: "Wikipedia fetch failed" });
    }
  };
}

module.exports = createWikipediaHandler();
module.exports.createWikipediaHandler = createWikipediaHandler;
