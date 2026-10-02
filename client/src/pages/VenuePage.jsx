import { useParams, Link } from "react-router-dom";
import { faMusic } from "@fortawesome/free-solid-svg-icons";
import { useVenueSetlists, useVenueEvents } from "../api/queries";
import { parseSetlistDate } from "../helpers/selectors";
import ConcertList from "../components/ArtistPage/ConcertList";
import TicketOptions from "../components/ArtistPage/TicketOptions";
import HotelOptions from "../components/ArtistPage/HotelOptions";
import ConcertReminder from "../components/ArtistPage/ConcertReminder";
import Map from "../components/ArtistPage/Map";
import { SEOHead } from "../components/SEOHead";

const artistOf = (event) =>
  event._embedded?.attractions?.[0]?.name || event.name || "Unknown artist";

// One venue, both sides of the timeline: setlist.fm for what was played there (any artist),
// Ticketmaster for what's on sale. The venue itself (name, city, coords) rides along on
// every setlist, so it costs no call of its own.
export default function VenuePage() {
  const { venueId } = useParams();
  const { data, isLoading, isError } = useVenueSetlists(venueId);
  const venue = data?.setlist?.[0]?.venue;
  const coords = venue?.city?.coords;
  const { data: upcomingData } = useVenueEvents(venue?.name, coords?.lat, coords?.long);

  if (isLoading) {
    return <div className="p-8 w-full text-center text-zinc-400">Loading venue…</div>;
  }
  if (isError || !venue) {
    return (
      <div className="p-8 w-full text-center text-zinc-500">
        Venue not found.{" "}
        <Link to="/" className="text-red-600 underline">
          Back to home
        </Link>
      </div>
    );
  }

  const now = new Date();
  const past = data.setlist
    .map((show) => ({ ...show, dateObj: parseSetlistDate(show.eventDate) }))
    .filter((show) => show.dateObj <= now);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = (upcomingData?.events || [])
    .map((event) => {
      const [year, month, day] = event.dates.start.localDate.split("-");
      return { ...event, dateObj: new Date(year, month - 1, day) };
    })
    .filter((event) => event.dateObj >= today);
  const place = [venue.city?.name, venue.city?.country?.name].filter(Boolean).join(", ");

  return (
    <>
      <SEOHead
        title={`${venue.name} - Concerts`}
        description={`Past setlists and upcoming concerts at ${venue.name}, ${place}.`}
        url={`/venues/${venueId}`}
      />
      <div className="w-full min-w-0 mx-auto p-0 sm:px-6 sm:py-4 space-y-4 lg:space-y-3">
        {/* Mesmo palco zinc do topo da página de artista (DESIGN.md). */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-zinc-100 shadow-[inset_0_-2px_4px_-2px_rgba(0,0,0,0.12)] px-3 lg:px-6 py-4 sm:-mx-6 sm:-mt-4">
          <div className="flex flex-col justify-center text-center lg:text-left">
            <h1 className="text-3xl font-bold text-balance">{venue.name}</h1>
            <p className="text-zinc-500">{place}</p>
          </div>
          {coords && (
            <div className="aspect-[103/60] w-full overflow-hidden rounded-md bg-zinc-100">
              <Map latitude={coords.lat} longitude={coords.long} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3">
          <div className="min-w-0 bg-white px-4 space-y-2">
            <ConcertList
              title="Past Concerts"
              empty="No past setlists for this venue yet."
              showSearch={false}
              items={past}
              locationOf={(show) => show.artist.name}
              linkOf={(show) => `/artists/${show.artist.mbid}/concerts/${show.id}`}
              icon={faMusic}
              iconTitle="View setlist"
            />
          </div>
          <div className="min-w-0 bg-white px-4 pb-4 space-y-2">
            <ConcertList
              title="Upcoming Concerts"
              empty="No upcoming concerts on sale for this venue."
              showSearch={false}
              items={upcoming}
              locationOf={artistOf}
              iconTitle="Get tickets"
              expand={(event) => (
                <>
                  <TicketOptions event={event} artistName={artistOf(event)} />
                  <HotelOptions event={event} />
                  <ConcertReminder event={event} artistName={artistOf(event)} />
                </>
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
}
