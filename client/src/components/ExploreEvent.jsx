import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons/faShareNodes";
import { AppContext } from "../context/AppContext";
import { artistOf, dateLabel } from "../helpers/selectors";
import Icon from "./Icon";
import Map from "./ArtistPage/Map";
import TicketOptions from "./ArtistPage/TicketOptions";
import HotelOptions from "./ArtistPage/HotelOptions";
import ConcertReminder from "./ArtistPage/ConcertReminder";
import { useT } from "../i18n";

// Next Concert's rows for an event with no artist (Home's Explore Events): no tour, and no
// date arrows since there's no tour to step through. Share points at the venue page — the
// share route only previews /artists/ pages, and these events have none.
export default function ExploreEvent({ event }) {
  const t = useT();
  const { goingConcertIds, toggleGoingConcert } = useContext(AppContext);
  const [linkCopied, setLinkCopied] = useState(false);
  const venue = event._embedded?.venues?.[0];
  const coords = venue?.location;
  const imGoing = goingConcertIds.includes(event.id);
  const venuePath = venue?.id && `/venues/ticketmaster:${venue.id}`;

  const share = async () => {
    const url = new URL(venuePath || "/", window.location.origin).href;
    const text = `${artistOf(event)} · ${dateLabel(event.dateObj)}${venue?.name ? ` · ${venue.name}` : ""}`;
    try {
      if (navigator.share) return await navigator.share({ title: artistOf(event), text, url });
      await navigator.clipboard.writeText(`${text} ${url}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Cancelled share sheet or no clipboard permission: nothing to report.
    }
  };

  return (
    <div className="px-2 py-3 sm:px-4 space-y-3">
      <ol className="min-w-0">
        <li className="flex justify-center gap-1 border-b border-zinc-300/50 py-2">
          <button type="button" onClick={share} title={t("Share this concert")} className="pill">
            <Icon icon={linkCopied ? faCheck : faShareNodes} className="text-[0.65rem]" />
            {linkCopied ? t("LINK COPIED") : t("SHARE")}
          </button>
          <button
            type="button"
            onClick={() => toggleGoingConcert(event.id)}
            aria-pressed={imGoing}
            title={
              imGoing ? t("Remove from concerts you're going to") : t("Mark that you're going")
            }
            className="pill"
          >
            <Icon icon={imGoing ? faCheck : faPlus} className="text-[0.65rem]" />
            {t("I'M GOING")}
          </button>
        </li>
        <li className="border-b border-zinc-300/50 py-2">
          <span className="font-semibold">{t("Concert date:")}</span>&ensp;
          {dateLabel(event.dateObj)}
        </li>
        <li className="border-b border-zinc-300/50 py-2">
          <span className="font-semibold">{t("Venue:")}</span>&ensp;
          {venuePath ? (
            <Link to={venuePath} className="text-red-600 hover:text-red-800 transition-colors">
              {venue.name}
            </Link>
          ) : (
            venue?.name
          )}
        </li>
        <li className="border-b border-zinc-300/50 py-2">
          <span className="font-semibold">{t("Location:")}</span>&ensp;
          {coords && <Icon icon={faLocationDot} className="mr-2 text-red-600" />}
          {venue?.city?.name}, {venue?.country?.countryCode}
        </li>
        <li className="flex flex-wrap items-center justify-center gap-2 border-b border-zinc-300/50 py-2">
          <TicketOptions event={event} artistName={artistOf(event)} iconOnly />
          <HotelOptions event={event} iconOnly />
          <ConcertReminder event={event} artistName={artistOf(event)} iconOnly />
        </li>
      </ol>
      {coords && (
        <div
          className="aspect-[103/60] w-full overflow-hidden rounded-md bg-zinc-100"
          aria-label={t("Concert location map")}
        >
          <Map latitude={coords.latitude} longitude={coords.longitude} />
        </div>
      )}
    </div>
  );
}
