import { useEffect, useState } from "react";

export default function useCity(coords) {
  const [city, setCity] = useState("Locating...");

  useEffect(() => {
    if (!coords?.lat || !coords?.long) return;

    const fetchCity = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.long}`
        );
        const data = await res.json();
        const location =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county;
        setCity(location || "Unknown");
      } catch (err) {
        console.error("City fetch error:", err);
        setCity("Unavailable");
      }
    };

    fetchCity();
  }, [coords]);

  return city;
}
