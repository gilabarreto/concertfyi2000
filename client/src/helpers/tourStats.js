import {
  dateLabel,
  distanceKm,
  parseSetlistDate,
  getUpcomingConcertsByArtist,
} from "./selectors.js";

// Keep the selected setlist.fm date available even when ticket vendors don't list it.
export function getTourUpcomingConcerts(events, artistName, shows, selectedId) {
  const upcoming = getUpcomingConcertsByArtist(events, artistName);
  if (!selectedId?.startsWith("setlist:")) return upcoming;
  const show = shows.find(
    (item) => `setlist:${item.id}` === selectedId && item.artist?.name === artistName,
  );
  if (!show?.eventDate) return upcoming;
  const dateObj = parseSetlistDate(show.eventDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!(dateObj >= today)) return upcoming;
  const city = show.venue?.city;
  return [
    ...upcoming,
    {
      id: selectedId,
      source: "setlistfm",
      url: show.url,
      tourName: show.tour?.name,
      dateObj,
      dates: { start: { localDate: show.eventDate.split("-").reverse().join("-") } },
      _embedded: {
        attractions: [{ name: artistName }],
        venues: [
          {
            id: show.venue?.id,
            name: show.venue?.name,
            city: { name: city?.name },
            country: { name: city?.country?.name, countryCode: city?.country?.code },
            ...(city?.coords
              ? { location: { latitude: city.coords.lat, longitude: city.coords.long } }
              : {}),
          },
        ],
      },
    },
  ].sort((a, b) => a.dateObj - b.dateObj);
}

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

export function getTourMapData(setlists = [], artistId, tourName, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const shows = setlists
    .filter(
      (show) =>
        show.artist?.mbid === artistId &&
        show.tour?.name?.trim().toLowerCase() === tourName?.trim().toLowerCase(),
    )
    .map((show) => ({ ...show, date: parseSetlistDate(show.eventDate) }))
    .filter((show) => !Number.isNaN(show.date.getTime()))
    .sort((a, b) => a.date - b.date);
  const past = shows.filter((show) => show.date < today);
  const upcoming = shows.length - past.length;
  const points = shows.flatMap((show) => {
    const coords = show.venue?.city?.coords;
    if (coords?.lat == null || coords?.long == null) return [];
    const lat = Number(coords.lat);
    const lng = Number(coords.long);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
      return [];
    return [
      {
        lat,
        lng,
        show,
        upcoming: show.date >= today,
        label: `${show.venue.city.name || ""} · ${dateLabel(show.date)}`,
      },
    ];
  });

  return { shows, past: past.length, upcoming, points };
}

export function findTourUpcomingEvent(show, events = []) {
  const normalize = (value) =>
    (value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const date = show.eventDate.split("-").reverse().join("-");
  const venueName = normalize(show.venue?.name);
  const cityName = normalize(show.venue?.city?.name);
  const country = normalize(show.venue?.city?.country?.code);
  const candidates = events.filter((event) => {
    const venue = event._embedded?.venues?.[0];
    const eventCountry = normalize(venue?.country?.countryCode);
    return (
      event.dates?.start?.localDate === date &&
      event._embedded?.attractions?.some(
        (artist) => normalize(artist.name) === normalize(show.artist?.name),
      ) &&
      !(country && eventCountry && country !== eventCountry)
    );
  });
  const exact = candidates.filter((event) => {
    const venue = event._embedded?.venues?.[0];
    return (
      venueName &&
      cityName &&
      normalize(venue?.name) === venueName &&
      normalize(venue?.city?.name) === cityName
    );
  });
  if (exact.length) return exact.length === 1 ? exact[0] : null;

  // Providers may use a sponsor's venue name or a neighboring municipality.
  // Require one compatible location on this artist's date, never just the date.
  const matches = candidates.filter((event) => {
    const venue = event._embedded?.venues?.[0];
    if (cityName && normalize(venue?.city?.name) === cityName) return true;
    if (venueName && normalize(venue?.name) === venueName) return true;
    const coords = show.venue?.city?.coords;
    const location = venue?.location;
    const km = distanceKm(coords?.lat, coords?.long, location?.latitude, location?.longitude);
    return km !== null && km <= 25;
  });
  return matches.length === 1 ? matches[0] : null;
}
