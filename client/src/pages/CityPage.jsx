import { useSearchParams } from "react-router-dom";
import { faMusic } from "@fortawesome/free-solid-svg-icons/faMusic";
import { useCurrentCity } from "../hooks/useCurrentCity";
import { useCitySetlists, useLocalEvents, useRecentSetlists } from "../api/queries";
import {
  getUpcomingConcertsByCity,
  getRecentUpcomingSetlists,
  parseSetlistDate,
} from "../helpers/selectors";
import ConcertList from "../components/ArtistPage/ConcertList";
import TicketOptions from "../components/ArtistPage/TicketOptions";
import HotelOptions from "../components/ArtistPage/HotelOptions";
import ConcertReminder from "../components/ArtistPage/ConcertReminder";
import Map from "../components/ArtistPage/Map";
import { SEOHead } from "../components/SEOHead";

const artistOf = (event) =>
  event._embedded?.attractions?.[0]?.name || event.name || "Unknown artist";

// My City: this year's setlists in the current city from setlist.fm, what's on sale there
// from Ticketmaster.
export default function CityPage() {
  const [params] = useSearchParams();
  const view = params.get("view");
  const focused = ["upcoming", "nearby", "recent"].includes(view);
  const { city, country, countryCode, lat, long } = useCurrentCity();
  const { data, isLoading } = useCitySetlists(
    focused ? null : city,
    countryCode,
    new Date().getFullYear(),
  );
  const { data: localEvents } = useLocalEvents(view === "recent" ? null : lat, long);

  const now = new Date();
  const past = (data?.setlist || [])
    .map((show) => ({ ...show, dateObj: parseSetlistDate(show.eventDate) }))
    .filter((show) => show.dateObj <= now);
  const upcoming = getUpcomingConcertsByCity(
    localEvents?._embedded?.events,
    city,
    view !== "nearby",
    { lat, long },
  );
  const { data: recentData, isLoading: recentLoading } = useRecentSetlists(
    view === "recent" ? city : null,
    countryCode,
  );
  const recent = getRecentUpcomingSetlists(recentData?.setlist, city, countryCode);
  const title =
    view === "nearby"
      ? `Concerts Near ${city}`
      : view === "recent"
        ? `Recently Added in ${city}`
        : `Upcoming Concerts in ${city}`;

  return (
    <>
      <SEOHead
        title={focused ? title : `Concerts in ${city}`}
        description={`Recent setlists and upcoming concerts in ${city}.`}
        url="/city"
      />
      <div className="w-full min-w-0 mx-auto p-0 sm:px-6 sm:py-4 space-y-4 lg:space-y-3">
        {/* Mesmo palco zinc do topo do venue e da página de artista (DESIGN.md). */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-zinc-100 shadow-[inset_0_-2px_4px_-2px_rgba(0,0,0,0.12)] px-3 lg:px-6 py-4 sm:-mx-6 sm:-mt-4">
          <div className="flex flex-col justify-center text-center lg:text-left">
            <h1 className="text-3xl font-bold text-balance">{focused ? title : city}</h1>
            <p className="text-zinc-500">
              {view === "nearby" ? `Neighboring cities within 50 km · ${country}` : country}
            </p>
          </div>
          <div className="aspect-[103/60] w-full overflow-hidden rounded-md bg-zinc-100">
            <Map latitude={lat} longitude={long} />
          </div>
        </div>

        <div className={`grid grid-cols-1 ${focused ? "" : "lg:grid-cols-2"} gap-4 lg:gap-3`}>
          {!focused && (
            <div className="min-w-0 bg-white px-4 space-y-2">
              <ConcertList
                title="Past Concerts"
                empty={isLoading ? "Loading…" : `No setlists from ${city} this year yet.`}
                showSearch={false}
                items={past}
                locationOf={(show) => `${show.artist.name} @ ${show.venue.name}`}
                linkOf={(show) => `/artists/${show.artist.mbid}/concerts/${show.id}`}
                icon={faMusic}
                iconTitle="View setlist"
              />
            </div>
          )}
          <div className="min-w-0 bg-white px-4 pb-4 space-y-2">
            {view === "recent" && (
              <p className="text-center text-xs text-zinc-500">
                Upcoming shows updated in the last 30 days
              </p>
            )}
            <ConcertList
              title={focused ? title : "Upcoming Concerts"}
              empty={
                view === "recent"
                  ? recentLoading
                    ? "Loading…"
                    : `No recently added upcoming concerts in ${city}.`
                  : view === "nearby"
                    ? `No concerts in neighboring cities within 50 km of ${city}.`
                    : `No upcoming concerts in ${city} right now.`
              }
              showSearch={false}
              items={view === "recent" ? recent : upcoming}
              linkOf={
                view === "recent"
                  ? (show) => `/artists/${show.artist.mbid}/concerts/${show.id}`
                  : undefined
              }
              icon={view === "recent" ? faMusic : undefined}
              locationOf={(event) =>
                view === "recent"
                  ? `${event.artist.name} @ ${event.venue?.name || "Venue to be announced"}`
                  : view === "nearby"
                    ? `${artistOf(event)} — ${event._embedded?.venues?.[0]?.city?.name}`
                    : artistOf(event)
              }
              iconTitle={view === "recent" ? "View concert" : "Get tickets"}
              expand={
                view === "recent"
                  ? undefined
                  : (event) => (
                      <>
                        <TicketOptions event={event} artistName={artistOf(event)} />
                        <HotelOptions event={event} />
                        <ConcertReminder event={event} artistName={artistOf(event)} />
                      </>
                    )
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
