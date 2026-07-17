const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/token", async (req, res) => {
  const { code, redirectUri } = req.body;

  console.log("Spotify token exchange:", {
    code: code?.slice(0, 10) + "...",
    redirectUri,
    clientId: process.env.SPOTIFY_CLIENT_ID?.slice(0, 5) + "...",
  });

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

    console.log("Spotify token received successfully");
    res.json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
    });
  } catch (error) {
    console.error("Spotify token error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Failed to get Spotify token",
    });
  }
});

module.exports = router;
