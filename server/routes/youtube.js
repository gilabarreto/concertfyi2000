const axios = require("axios");

const getYoutubeVideoId = async (req, res) => {
  const { artist, song } = req.query;

  if (!artist || !song) {
    return res.status(400).json({ error: "Missing artist or song" });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "YouTube API key not configured" });
    }

    const query = `${artist} ${song} official video`;
    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        q: query,
        part: "snippet",
        type: "video",
        maxResults: 1,
        key: apiKey,
      },
    });

    const videoId = response.data.items?.[0]?.id?.videoId;
    if (!videoId) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({ videoId });
  } catch (error) {
    console.error("YouTube API error:", error.message);
    res.status(500).json({ error: "Failed to search YouTube" });
  }
};

module.exports = getYoutubeVideoId;
