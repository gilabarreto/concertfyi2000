const express = require("express");
const router = express.Router();
const { request } = require("../http");

router.post("/token", async (req, res) => {
  const { code, redirectUri } = req.body;

  try {
    const data = await request("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
    });

    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Spotify token error:", error.message);
    res.status(error.status || 500).json({
      error: error.data || "Failed to get Spotify token",
      details: error.message,
    });
  }
});

module.exports = router;
