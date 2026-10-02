import { useTourSetlists } from "../../api/queries";
import { getTourStats } from "../../helpers/tourStats";
import { dateLabel, getUpcomingConcertsByArtist, parseSetlistDate } from "../../helpers/selectors";
import CardTitle from "./CardTitle";
import { TourMap } from "./Map";

const NA = "N/A";
const song = (stat, of) => (stat ? `${stat.name} (${stat.count}/${of})` : NA);

// Below Artist Info: numbers for the tour the open concert belongs to, with the tour's
// shows on a map beside them. Without a tour name (or with setlist.fm down) every row
// still renders, as N/A, so the card doesn't jump around between artists.
export default function TourStats({ concert, ticketmaster }) {
  const tourName = concert.tour?.name;
  const { data, isLoading } = useTourSetlists(concert.artist.mbid, tourName);
  const shows = data?.setlist || [];
  const stats = getTourStats(shows);
  const value = (v) => (isLoading ? "…" : (v ?? NA));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pastPoints = shows
    .filter((show) => parseSetlistDate(show.eventDate) <= today && show.venue?.city?.coords)
    .map((show) => ({
      lat: show.venue.city.coords.lat,
      lng: show.venue.city.coords.long,
      label: `${show.venue.city.name} · ${dateLabel(parseSetlistDate(show.eventDate))}`,
    }));
  // Upcoming: what Ticketmaster sells (same list as Upcoming Concerts), plus the tour dates
  // setlist.fm already knows about, minus the ones both have.
  const ticketmasterDates = getUpcomingConcertsByArtist(ticketmaster.events, concert.artist.name)
    .filter((event) => event._embedded?.venues?.[0]?.location)
    .map((event) => ({
      lat: Number(event._embedded.venues[0].location.latitude),
      lng: Number(event._embedded.venues[0].location.longitude),
      label: `${event._embedded.venues[0].city?.name} · ${dateLabel(event.dateObj)}`,
      date: event.dates.start.localDate,
      upcoming: true,
    }));
  const setlistDates = shows
    .filter((show) => parseSetlistDate(show.eventDate) > today && show.venue?.city?.coords)
    .map((show) => ({
      lat: show.venue.city.coords.lat,
      lng: show.venue.city.coords.long,
      label: `${show.venue.city.name} · ${dateLabel(parseSetlistDate(show.eventDate))}`,
      date: show.eventDate.split("-").reverse().join("-"),
      upcoming: true,
    }))
    .filter((point) => !ticketmasterDates.some((t) => t.date === point.date));
  const points = [...pastPoints, ...ticketmasterDates, ...setlistDates];

  const dates =
    stats.firstDate && stats.lastDate
      ? `${dateLabel(stats.firstDate)} – ${dateLabel(stats.lastDate)}`
      : null;
  const rows = [
    ["Tour", tourName || NA],
    ["Dates", value(tourName && dates)],
    ["Shows played", value(stats.shows)],
    ["Upcoming", value(points.filter((p) => p.upcoming).length || null)],
    ["Countries", value(stats.countries)],
    ["Cities", value(stats.cities)],
    ["Songs per show", value(stats.avgSongs)],
    ["Most played", isLoading ? "…" : song(stats.mostPlayed, stats.withSongs)],
    ["Usual opener", isLoading ? "…" : song(stats.opener, stats.withSongs)],
    ["Usual closer", isLoading ? "…" : song(stats.closer, stats.withSongs)],
    ["Played only once", value(stats.rarities && `${stats.rarities} songs`)],
  ];

  return (
    <>
      <CardTitle id="tour-stats" className="scroll-mt-20">
        Tour Statistics
      </CardTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3">
        <ol className="px-[12px]">
          {rows.map(([label, text]) => (
            <li key={label} className="border-b border-zinc-300/50 py-2">
              <span className="font-semibold">{label}:</span>&ensp;{text}
            </li>
          ))}
        </ol>
        <div className="flex min-h-72 flex-col">
          {points.length ? (
            <>
              <div className="min-h-64 flex-1">
                <TourMap points={points} />
              </div>
              <p className="flex justify-center gap-4 py-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" /> Past
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-red-600" />{" "}
                  Upcoming
                </span>
              </p>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-500">
              {isLoading ? "Loading map…" : "Map N/A"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
