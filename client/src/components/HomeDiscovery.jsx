import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { faBuilding } from "@fortawesome/free-solid-svg-icons/faBuilding";
import { useCitySetlists, useLocalEvents } from "../api/queries";
import { artistOf, getExploreEvents, getUpcomingConcertsByCity } from "../helpers/selectors";
import CardTitle from "./ArtistPage/CardTitle";
import Icon from "./Icon";
import ConcertList from "./ArtistPage/ConcertList";
import TicketOptions from "./ArtistPage/TicketOptions";
import HotelOptions from "./ArtistPage/HotelOptions";
import ConcertReminder from "./ArtistPage/ConcertReminder";
import ViewConcertButton from "./ArtistPage/ViewConcertButton";
import ExploreEvent from "./ExploreEvent";
import useIsSmallScreen from "../hooks/useScreenSize";

import { useT } from "../i18n";
const normalize = (value = "") =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const safeUrl = (value) => (/^https?:\/\//i.test(value || "") ? value : undefined);
function VenueTile({ venue, ticketmaster }) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  // Ticketmaster only. Google photos used to fill the gaps, but each tile cost a search,
  // a GetPlace and an image against the same daily cap the venue pages need, and a few
  // Home visits used it up: the venue page then showed nothing from Google all day.
  const image = ticketmaster?.images?.find((item) => safeUrl(item.url))?.url;
  const src = !failed && image;
  return (
    <li className="w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-3.75rem)/6)] min-w-0">
      <Link to={`/venues/${venue.id}`} className="group block space-y-1 text-center">
        {src ? (
          <img
            src={src}
            alt={venue.name}
            loading="lazy"
            onError={() => setFailed(true)}
            className="aspect-square w-full rounded-md object-cover bg-zinc-100 transition-opacity group-hover:opacity-80"
          />
        ) : (
          <div
            className="aspect-square w-full rounded-md bg-zinc-100 flex items-center justify-center text-zinc-400"
            aria-label={t("No photo available.")}
          >
            <Icon icon={faBuilding} className="text-3xl" />
          </div>
        )}
        <span className="block line-clamp-2 text-balance text-sm group-hover:text-red-800">
          {venue.name}
        </span>
      </Link>
    </li>
  );
}

function VenueCarousel({ venues, events, city, loading }) {
  const t = useT();
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setDesktop(media.matches);
      setPage(0);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const limit = desktop ? 6 : 3;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(venues.length / limit) - 1));
  const visible = venues.slice(currentPage * limit, (currentPage + 1) * limit);
  const carouselRef = useRef(null);
  const tilesRef = useRef(null);
  useEffect(() => {
    const tiles = tilesRef.current;
    if (!tiles) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(tiles).columnGap);
      const photoSize = (tiles.clientWidth - gap * (limit - 1)) / limit;
      carouselRef.current.style.setProperty("--venue-photo-size", `${photoSize}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tiles);
    return () => observer.disconnect();
  }, [limit, venues.length]);
  return (
    <section aria-label={`Venues in ${city}`} className="w-full min-w-0 bg-white px-4 space-y-2">
      <CardTitle>
        <Link to="/venues" className="hover:text-red-800">
          {t("Nearby Venues")}
        </Link>
      </CardTitle>
      {!venues.length ? (
        <p className="py-4 text-center text-sm text-zinc-500" role="status">
          {loading ? t("Loading…") : t("No nearby venues.")}
        </p>
      ) : (
        <div ref={carouselRef} className="flex items-start gap-4" aria-roledescription="carousel">
          <button
            type="button"
            aria-label={t("Previous venues")}
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            style={{ marginTop: "calc((var(--venue-photo-size, 84px) - 84px) / 2)" }}
            className="flex h-[84px] w-6 shrink-0 items-center justify-center text-[5.25rem] font-light leading-none text-red-600 disabled:text-zinc-300"
          >
            {"{"}
          </button>
          <ul ref={tilesRef} className="flex min-w-0 flex-1 justify-center gap-3">
            {visible.map((venue) => {
              const matches = events
                .flatMap((event) => event._embedded?.venues || [])
                .filter(
                  (item) =>
                    normalize(item.name) === normalize(venue.name) &&
                    normalize(item.city?.name) === normalize(city),
                );
              const ids = new Set(matches.map((item) => item.id));
              return (
                <VenueTile
                  key={venue.id}
                  venue={venue}
                  ticketmaster={ids.size === 1 ? matches[0] : undefined}
                />
              );
            })}
          </ul>
          <button
            type="button"
            aria-label={t("Next venues")}
            disabled={(currentPage + 1) * limit >= venues.length}
            onClick={() => setPage(currentPage + 1)}
            style={{ marginTop: "calc((var(--venue-photo-size, 84px) - 84px) / 2)" }}
            className="flex h-[84px] w-6 shrink-0 items-center justify-center text-[5.25rem] font-light leading-none text-red-600 disabled:text-zinc-300"
          >
            {"}"}
          </button>
        </div>
      )}
    </section>
  );
}

export default function HomeDiscovery({ location }) {
  const t = useT();
  const mobile = useIsSmallScreen(640);
  const { city, countryCode, lat, long } = location;
  const local = useLocalEvents(lat, long);
  const setlists = useCitySetlists(city, countryCode, new Date().getFullYear());
  const events = local.data?._embedded?.events || [];
  const byVenue = new Map();
  for (const { venue } of setlists.data?.setlist || []) {
    if (!venue?.id || normalize(venue.city?.name) !== normalize(city)) continue;
    const entry = byVenue.get(venue.id) || { ...venue, shows: 0 };
    entry.shows += 1;
    byVenue.set(venue.id, entry);
  }
  const venues = [...byVenue.values()].sort((a, b) => b.shows - a.shows);
  const exploreEvents = getExploreEvents(events, city, { lat, long });
  return (
    <div className="w-full min-w-0 space-y-4 lg:space-y-3">
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3"
        aria-label={t("Local concert lists")}
        key={`${city}-${lat}-${long}`}
      >
        {[
          { title: t("Upcoming Concerts"), nearby: false },
          { title: t("Concerts Near {city}", { city }), nearby: true },
        ].map(({ title, nearby }) => (
          <section
            key={title}
            aria-label={title}
            className="min-w-0 bg-white px-4 pb-4 space-y-2 lg:flex lg:flex-col"
          >
            <ConcertList
              title={title}
              empty={
                local.isLoading
                  ? t("Loading…")
                  : nearby
                    ? t("No concerts available.")
                    : t("No upcoming concerts available.")
              }
              showSearch={false}
              pageSize={nearby || mobile ? 5 : 7}
              items={getUpcomingConcertsByCity(events, city, !nearby, { lat, long })}
              locationOf={artistOf}
              secondaryTextOf={
                nearby ? (event) => event._embedded?.venues?.[0]?.city?.name : undefined
              }
              iconTitle={t("Get tickets")}
              expand={(event) => (
                <>
                  <TicketOptions event={event} artistName={artistOf(event)} />
                  <HotelOptions event={event} />
                  <ConcertReminder event={event} artistName={artistOf(event)} showShare={false} />
                  <ViewConcertButton event={event} artistName={artistOf(event)} />
                </>
              )}
            />
          </section>
        ))}
      </div>
      <VenueCarousel
        key={`${city}-${countryCode}-${lat}-${long}`}
        venues={venues}
        events={events}
        city={city}
        loading={setlists.isLoading}
      />
      {exploreEvents.length > 0 && (
        <section
          aria-label={t("Explore Events")}
          className="w-full min-w-0 bg-white px-4 pb-4 space-y-2"
        >
          <ConcertList
            title={t("Explore Events")}
            showSearch={false}
            pageSize={mobile ? 5 : 10}
            columns
            items={exploreEvents}
            locationOf={artistOf}
            secondaryTextOf={(event) => event._embedded?.venues?.[0]?.name}
            wrap
            iconTitle={t("Get tickets")}
            expand={(event) => <ExploreEvent event={event} />}
          />
        </section>
      )}
    </div>
  );
}
