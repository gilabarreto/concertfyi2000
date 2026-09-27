const express = require("express");

const router = express.Router();
const SITE_URL = "https://concertfyi.com";
const SHARE_ORIGIN = process.env.RENDER_EXTERNAL_URL || "https://concertfyi2000.onrender.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });

const boundedText = (value, maxLength) =>
  (typeof value === "string" ? value.trim().slice(0, maxLength) : "");

router.get("/", (req, res) => {
  const targetParam = boundedText(req.query.target, 2048);
  const title = boundedText(req.query.title, 160) || "ConcertFYI";
  const description = boundedText(req.query.description, 400) || "Discover concerts and setlists on ConcertFYI.";
  const imageParam = boundedText(req.query.image, 2048);

  let target;
  try {
    target = new URL(targetParam);
  } catch {
    return res.status(400).send("Invalid share target");
  }

  if (target.origin !== SITE_URL || !target.pathname.startsWith("/artists/")) {
    return res.status(400).send("Invalid share target");
  }

  let image = DEFAULT_IMAGE;
  try {
    const candidate = new URL(imageParam);
    if (candidate.protocol === "https:" && candidate.hostname === "s1.ticketm.net") {
      image = candidate.href;
    }
  } catch {
    // Use the site's default preview image when the concert has no Ticketmaster art.
  }

  const continueUrl = escapeHtml(target.href);
  const canonical = escapeHtml(new URL(req.originalUrl, SHARE_ORIGIN).href);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);

  res
    .set("Cache-Control", "public, max-age=300")
    .type("html")
    .send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${safeTitle} | concertfyi</title>
<meta name="description" content="${safeDescription}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${safeTitle} | concertfyi">
<meta property="og:description" content="${safeDescription}">
<meta property="og:image" content="${safeImage}">
<meta property="og:image:secure_url" content="${safeImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle} | concertfyi">
<meta name="twitter:description" content="${safeDescription}">
<meta name="twitter:image" content="${safeImage}">
</head>
<body>
<a id="continue" href="${continueUrl}">Continue to concertfyi.com</a>
<script>window.location.replace(document.getElementById("continue").href)</script>
</body>
</html>`);
});

module.exports = router;
