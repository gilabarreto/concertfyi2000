import { getPastConcertsByArtist } from "./selectors.js";

const normalize = (name = "") =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

export function getConcertTarget(shows = [], artistName, eventId) {
  if (!artistName || !eventId) return null;
  const matches = shows.filter(
    (show) => show.id && show.artist?.mbid && normalize(show.artist.name) === normalize(artistName),
  );
  const artists = [...new Set(matches.map((show) => show.artist.mbid))];
  if (artists.length !== 1) return null;
  const artistId = artists[0];
  const concert = getPastConcertsByArtist(matches, artistId)[0] || matches[0];
  return {
    pathname: `/artists/${artistId}/concerts/${concert.id}`,
    search: `?${new URLSearchParams({ next: eventId })}`,
  };
}
