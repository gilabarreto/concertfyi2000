import { getBestImage } from "./selectors.js";

const normalize = (value) =>
  (typeof value === "string" ? value : "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const safeLink = (value) => (/^https?:\/\//i.test(value || "") ? value : null);

export function artworkQuery(concert) {
  const parts = /^(\d{2})-(\d{2})-(\d{4})$/.exec(concert.eventDate || "");
  return {
    mbid: concert.artist?.mbid || "",
    date: parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : "",
    venue: concert.venue?.name || "",
    city: concert.venue?.city?.name || "",
  };
}

// Ticketmaster images are promotional artwork, never labelled as archival posters.
// Only reuse event artwork when date, venue, city AND performer match the setlist.
export function artworkFallbacks(concert, ticketmaster = {}) {
  const query = artworkQuery(concert);
  const artist = normalize(concert.artist?.name);
  const matchesArtist = (item) => artist && normalize(item.name) === artist;
  const events = (ticketmaster.events || []).filter((event) => {
    const venue = event._embedded?.venues?.[0];
    return (
      query.date &&
      query.venue &&
      query.city &&
      event.dates?.start?.localDate === query.date &&
      normalize(venue?.name) === normalize(query.venue) &&
      normalize(venue?.city?.name) === normalize(query.city) &&
      event._embedded?.attractions?.some(matchesArtist)
    );
  });
  const event = events.length === 1 ? events[0] : null;
  return [
    {
      kind: "event-image",
      imageUrl: getBestImage(event?.images || []),
      sourceUrl: safeLink(event?.url),
      source: "Ticketmaster",
    },
  ].filter((item) => safeLink(item.imageUrl));
}
