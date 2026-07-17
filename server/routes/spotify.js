const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/token", async (req, res) => {
  const { code, redirectUri } = req.body;

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
    });
  } catch (error) {
    console.error("Spotify token error:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Failed to get Spotify token",
    });
  }
});

module.exports = router;
