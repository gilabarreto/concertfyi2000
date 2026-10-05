import { useParams, Link } from "react-router-dom";
import { faEye } from "@fortawesome/free-solid-svg-icons/faEye";
import Icon from "../components/Icon";
import {
  useVenueSetlists,
  useVenueEvents,
  useVenueDetails,
  useVenueInfo,
  useVenueServices,
  useTicketmasterVenue,
} from "../api/queries";
import VenueInfo from "../components/VenuePage/VenueInfo";
import VenueActions from "../components/VenuePage/VenueActions";
import VenuePhotos from "../components/VenuePage/VenuePhotos";
import VenueRating from "../components/VenuePage/VenueRating";
import VenueReviewSummary from "../components/VenuePage/VenueReviewSummary";
import { artistOf, parseSetlistDate, withTicketmasterDate } from "../helpers/selectors";
import ConcertList from "../components/ArtistPage/ConcertList";
import TicketOptions from "../components/ArtistPage/TicketOptions";
import HotelOptions from "../components/ArtistPage/HotelOptions";
import ConcertReminder from "../components/ArtistPage/ConcertReminder";
import ViewConcertButton from "../components/ArtistPage/ViewConcertButton";
import Map from "../components/ArtistPage/Map";
import { SEOHead } from "../components/SEOHead";

// One venue, both sides of the timeline: setlist.fm for what was played there (any artist),
// Ticketmaster for what's on sale. The venue itself (name, city, coords) rides along on
// every setlist, so it costs no call of its own.
export default function VenuePage() {
  const { venueId } = useParams();
  const isTicketmaster = venueId.startsWith("ticketmaster:");
  const { data: lookup, isLoading: lookupLoading } = useTicketmasterVenue(
    isTicketmaster ? venueId.slice("ticketmaster:".length) : null,
  );
  const { data, isLoading } = useVenueSetlists(isTicketmaster ? lookup?.setlistVenueId : venueId);
  const listVenue = data?.setlist?.[0]?.venue;
  const { data: directVenue, isLoading: detailsLoading } = useVenueDetails(
    isTicketmaster ? null : venueId,
    !isTicketmaster && !isLoading && !listVenue,
  );
  const venue = isTicketmaster ? lookup?.venue : listVenue || directVenue;
  const coords = venue?.city?.coords;
  const { data: upcomingData, isLoading: eventsLoading } = useVenueEvents(
    venue?.name,
    coords?.lat,
    coords?.long,
  );
  const {
    data: info = {},
    isLoading: infoLoading,
    isError: infoFailed,
    refetch: retryInfo,
  } = useVenueInfo(venue?.name, coords?.lat, coords?.long);
  const ticketmasterVenue = lookup?.ticketmaster || upcomingData?.venue;
  const location = ticketmasterVenue?.location;
  const exactCoords = location
    ? { lat: Number(location.latitude), long: Number(location.longitude) }
    : info.coordinates;
  const mapCoords = exactCoords || coords;
  const identity = {
    name: venue?.name,
    lat: mapCoords?.lat,
    long: mapCoords?.long,
    exact: !!exactCoords,
  };
  const {
    data: services = {},
    isLoading: servicesLoading,
    isError: servicesFailed,
    refetch: retryServices,
  } = useVenueServices(
    identity,
    // Ticketmaster's exact location settles the identity; only without it is Wikidata's worth waiting for.
    !!venue && (!!location || (!infoLoading && !eventsLoading)),
  );

  if (lookupLoading || (!isTicketmaster && (isLoading || detailsLoading))) {
    return <div className="p-8 w-full text-center text-zinc-400">Loading venue…</div>;
  }
  if (!venue) {
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
  const past = (data?.setlist || [])
    .map((show) => ({ ...show, dateObj: parseSetlistDate(show.eventDate) }))
    .filter((show) => show.dateObj <= now);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = (upcomingData?.events || [])
    .filter(
      (event) =>
        /^\d{4}-\d{2}-\d{2}$/.test(event.dates?.start?.localDate || "") &&
        !event.dates.start.dateTBD &&
        !event.dates.start.dateTBA,
    )
    .map(withTicketmasterDate)
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stage px-3 lg:px-6 py-4 sm:-mx-6 sm:-mt-4">
          <div className="w-full min-w-0">
            <VenueInfo
              key={venueId}
              venue={venue}
              ticketmaster={ticketmasterVenue}
              info={info}
              services={services}
              loading={infoLoading || servicesLoading}
              failed={infoFailed || servicesFailed || services.partial}
              onRetry={() => {
                retryInfo();
                retryServices();
              }}
            />
          </div>
          <div className="w-full self-start">
            {mapCoords && (
              <>
                <div className="aspect-[103/60] w-full overflow-hidden rounded-md bg-zinc-100">
                  <Map latitude={mapCoords.lat} longitude={mapCoords.long} />
                </div>
                {!exactCoords && (
                  <p className="mt-1 text-center text-xs text-zinc-500">
                    City location · exact venue location unavailable
                  </p>
                )}
              </>
            )}
            <VenueActions ticketmaster={ticketmasterVenue} services={services} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-3">
          <VenueRating rating={services.fields?.rating} />
          <VenueReviewSummary
            key={venueId}
            reviews={services.reviews}
            url={services.fields?.rating?.url}
            loading={servicesLoading}
          />
        </div>
        <VenuePhotos
          key={venueId}
          identity={identity}
          enabled={!!services.fields?.rating || services.providers?.google === "ok"}
          name={venue.name}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3">
          <div className="min-w-0 bg-white px-4 space-y-2">
            <ConcertList
              title="Past Concerts"
              empty={isLoading ? "Loading…" : "No past setlists for this venue yet."}
              showSearch={false}
              items={past}
              locationOf={(show) => show.artist.name}
              iconTitle="Show concert options"
              expand={(show) => (
                <div className="px-2 py-3 sm:px-4">
                  <Link
                    to={`/artists/${show.artist.mbid}/concerts/${show.id}`}
                    state={{ scrollTo: "last-concert" }}
                    className="w-full px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon icon={faEye} />
                    View concert
                  </Link>
                </div>
              )}
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
                  <ConcertReminder event={event} artistName={artistOf(event)} showShare={false} />
                  <ViewConcertButton event={event} artistName={artistOf(event)} />
                </>
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
}
