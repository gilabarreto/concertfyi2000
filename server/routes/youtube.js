const { request } = require("../http");

// Uma busca custa 100 de uma cota de 10.000/dia, e o id do vídeo de uma música não muda.
// O cache é o KV do Cloudflare, entregue pelo worker.mjs em app.locals; no Node (dev,
// testes) ele não existe e a rota busca sempre, como antes. 30 dias e não para sempre:
// é o prazo das políticas da API do YouTube para guardar o que ela devolve.
const TTL = 30 * 24 * 60 * 60;

function createYoutubeHandler({ fetchJson = request } = {}) {
  return async (req, res) => {
    const { artist, song } = req.query;

    if (!artist || !song || typeof artist !== "string" || typeof song !== "string") {
      return res.status(400).json({ error: "Missing artist or song" });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "YouTube API key not configured" });
    }

    const cache = req.app?.locals?.songCache;
    // Chave do KV tem teto de 512 bytes; o corte só junta nomes absurdamente longos.
    const key = `yt:${artist.trim().toLowerCase()}|${song.trim().toLowerCase()}`.slice(0, 500);

    // Falha do KV não pode derrubar a música: cai para a busca de sempre.
    const cached = cache && (await cache.get(key).catch(() => null));
    if (cached) return res.json({ videoId: cached });

    try {
      const data = await fetchJson("https://www.googleapis.com/youtube/v3/search", {
        params: {
          q: `${artist} ${song} official video`,
          part: "snippet",
          type: "video",
          maxResults: 1,
          key: apiKey,
        },
      });

      const videoId = data.items?.[0]?.id?.videoId;
      if (!videoId) {
        return res.status(404).json({ error: "Video not found" });
      }

      // O plano grátis aceita 1.000 escritas/dia; passou disso, só deixa de guardar.
      if (cache) await cache.put(key, videoId, { expirationTtl: TTL }).catch(() => {});
      res.json({ videoId });
    } catch (error) {
      console.error("YouTube API error:", error.message);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  };
}

module.exports = createYoutubeHandler();
module.exports.createYoutubeHandler = createYoutubeHandler;
