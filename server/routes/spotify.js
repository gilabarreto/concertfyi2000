const express = require("express");
const router = express.Router();
const { request } = require("../http");

router.post("/token", async (req, res) => {
  const { code, redirectUri } = req.body;

  if (typeof code !== "string" || typeof redirectUri !== "string") {
    return res.status(400).json({ error: "Missing code or redirectUri" });
  }

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
    // Sem `details`: a mensagem carrega o endpoint que chamamos, e o cliente não
    // fazia nada com ela. O que a Spotify respondeu (`invalid_grant` e afins) fica.
    res.status(error.status || 500).json({
      error: error.data || "Failed to get Spotify token",
    });
  }
});

module.exports = router;
