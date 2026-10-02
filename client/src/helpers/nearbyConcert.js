import { distanceKm, getUpcomingConcertsByArtist } from "./selectors.js";

// Mesmo raio de 50 km da busca local. Coordenadas evitam confundir cidades homônimas.
export function getNearbyConcert(events, artist, coords) {
  return (
    getUpcomingConcertsByArtist(events, artist).find((event) => {
      if (["cancelled", "postponed"].includes(event.dates?.status?.code)) return false;
      const location = event._embedded?.venues?.[0]?.location;
      const km = distanceKm(coords?.lat, coords?.long, location?.latitude, location?.longitude);
      return km !== null && km <= 50;
    }) || null
  );
}
