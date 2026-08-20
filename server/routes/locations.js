const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: "Query too short" });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(query)}&format=json&limit=10&countrycodes=BR,US,AR,MX,CL,CO,PE,ES,PT`
    );

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();

    const formatted = data
      .map((item) => ({
        city: item.address?.city || item.address?.town || item.name,
        country: item.address?.country || "Unknown",
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }))
      .filter(
        (item, idx, arr) =>
          arr.findIndex(
            (a) => a.city === item.city && a.country === item.country
          ) === idx
      )
      .slice(0, 5);

    return res.json({ locations: formatted });
  } catch (err) {
    console.error("Locations API error:", err);
    return res.status(500).json({ error: "Failed to search locations" });
  }
};
