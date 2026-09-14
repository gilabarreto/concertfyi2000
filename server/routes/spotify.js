const express = require("express");
const router = express.Router();
const { request } = require("../http");

router.post("/token", async (req, res) => {
  const { code, redirectUri } = req.body;

  console.log("Spotify token exchange:", {
    code: code?.slice(0, 10) + "...",
    redirectUri,
    clientId: process.env.SPOTIFY_CLIENT_ID?.slice(0, 5) + "...",
  });

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

    console.log("Spotify token received successfully");
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Spotify token error details:", {
      message: error.message,
      status: error.status,
      data: JSON.stringify(error.data),
      requestData: { code: code?.slice(0, 10), redirectUri },
    });
    res.status(error.status || 500).json({
      error: error.data || "Failed to get Spotify token",
      details: error.message,
    });
  }
});

module.exports = router;
