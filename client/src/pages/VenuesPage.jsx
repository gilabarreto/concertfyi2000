import { Link } from "react-router-dom";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight";
import { useCurrentCity } from "../hooks/useCurrentCity";
import { useCitySetlists } from "../api/queries";
import CardTitle from "../components/ArtistPage/CardTitle";
import CardNotice from "../components/ArtistPage/CardNotice";
import Icon from "../components/Icon";
import { SEOHead } from "../components/SEOHead";

// Home's VENUE button: the venues of the current city, busiest first. Built from the same
// setlists My City already fetches (setlist.fm's own venue search has no ranking — São
// Paulo alone returns 1,892 venues in name order).
export default function VenuesPage() {
  const { city, country, countryCode } = useCurrentCity();
  const { data, isLoading } = useCitySetlists(city, countryCode, new Date().getFullYear());

  const byVenue = {};
  (data?.setlist || []).forEach(({ venue }) => {
    if (!venue?.id) return;
    byVenue[venue.id] ??= { ...venue, shows: 0 };
    byVenue[venue.id].shows += 1;
  });
  const venues = Object.values(byVenue).sort((a, b) => b.shows - a.shows);

  return (
    <>
      <SEOHead
        title={`Venues in ${city}`}
        description={`Concert venues in ${city} with past setlists and upcoming shows.`}
        url="/venues"
      />
      <div className="w-full min-w-0 mx-auto p-0 sm:px-6 sm:py-4 space-y-4 lg:space-y-3">
        <div className="stage px-3 lg:px-6 py-4 sm:-mx-6 sm:-mt-4 text-center">
          <h1 className="text-3xl font-bold text-balance">Venues in {city}</h1>
          <p className="text-zinc-500">{country}</p>
        </div>
        <div className="bg-white px-4 space-y-2">
          <CardTitle>Busiest this year</CardTitle>
          {venues.length === 0 ? (
            <CardNotice>
              {isLoading
                ? "Loading…"
                : `No venues available in ${city} this year yet. Check back later.`}
            </CardNotice>
          ) : (
            <ol className="px-[12px]">
              {venues.map((venue) => (
                <li key={venue.id} className="border-b border-zinc-300/50">
                  <Link
                    to={`/venues/${venue.id}`}
                    className="flex w-full items-center justify-between gap-2 py-2 hover:text-red-800"
                  >
                    <span className="flex min-w-0 items-center">
                      <span className="truncate">{venue.name}</span>
                      <span className="text-zinc-500 ml-2 shrink-0">
                        - {venue.shows} {venue.shows === 1 ? "show" : "shows"}
                      </span>
                    </span>
                    <Icon icon={faChevronRight} className="text-red-600 shrink-0" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
