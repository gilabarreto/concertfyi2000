import { parseSetlistDate } from "./selectors.js";

// Tour Statistics card. Takes every setlist.fm show of one tour and returns plain numbers;
// anything the data can't answer comes back null so the card can print N/A.
export function getTourStats(shows = [], now = new Date()) {
  const dated = shows
    .map((show) => ({ ...show, dateObj: parseSetlistDate(show.eventDate) }))
    .sort((a, b) => a.dateObj - b.dateObj);
  const past = dated.filter((show) => show.dateObj <= now);
  // Tape is the intro/outro music played over the PA, not something the band played.
  const songsOf = (show) =>
    (show.sets?.set || []).flatMap((set) => set.song || []).filter((song) => !song.tape);
  const played = past.map(songsOf).filter((songs) => songs.length > 0);

  const counts = {};
  played.flat().forEach(({ name }) => (counts[name] = (counts[name] || 0) + 1));
  const top = (names) => {
    const tally = {};
    names.forEach((name) => (tally[name] = (tally[name] || 0) + 1));
    const [name, count] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] || [];
    return name ? { name, count } : null;
  };
  const distinct = (key) => new Set(past.map(key).filter(Boolean)).size || null;

  return {
    shows: past.length || null,
    upcoming: dated.length - past.length || null,
    firstDate: dated[0]?.dateObj || null,
    lastDate: dated.at(-1)?.dateObj || null,
    countries: distinct((show) => show.venue?.city?.country?.code),
    cities: distinct((show) => show.venue?.city?.id),
    avgSongs: played.length
      ? Math.round(played.reduce((sum, songs) => sum + songs.length, 0) / played.length)
      : null,
    mostPlayed: top(played.flat().map((song) => song.name)),
    opener: top(played.map((songs) => songs[0].name)),
    closer: top(played.map((songs) => songs.at(-1).name)),
    rarities: Object.values(counts).filter((count) => count === 1).length || null,
    withSongs: played.length,
  };
}
