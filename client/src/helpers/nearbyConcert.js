import { getUpcomingConcertsByArtist } from "./selectors.js";

const coordinate = (value, limit) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value)) &&
  Math.abs(Number(value)) <= limit;

// Mesmo raio de 50 km da busca local. Coordenadas evitam confundir cidades homônimas.
export function getNearbyConcert(events, artist, coords) {
  if (!coordinate(coords?.lat, 90) || !coordinate(coords?.long, 180)) return null;
  const radians = (degrees) => (Number(degrees) * Math.PI) / 180;
  return (
    getUpcomingConcertsByArtist(events, artist).find((event) => {
      if (["cancelled", "postponed"].includes(event.dates?.status?.code)) return false;
      const location = event._embedded?.venues?.[0]?.location;
      if (!coordinate(location?.latitude, 90) || !coordinate(location?.longitude, 180))
        return false;
      const lat = radians(coords.lat);
      const venueLat = radians(location.latitude);
      const deltaLong = radians(location.longitude) - radians(coords.long);
      const a =
        Math.sin((venueLat - lat) / 2) ** 2 +
        Math.cos(lat) * Math.cos(venueLat) * Math.sin(deltaLong / 2) ** 2;
      return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a))) <= 50;
    }) || null
  );
}
