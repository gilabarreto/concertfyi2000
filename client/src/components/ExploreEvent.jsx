import { useContext } from "react";
import { Link } from "react-router-dom";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { AppContext } from "../context/AppContext";
import { artistOf, dateLabel, getBestImage } from "../helpers/selectors";
import ShareButton from "./ShareButton";
import Icon from "./Icon";
import TicketOptions from "./ArtistPage/TicketOptions";
import HotelOptions from "./ArtistPage/HotelOptions";
import ConcertReminder from "./ArtistPage/ConcertReminder";
import { useT } from "../i18n";

// Next Concert's rows for an event with no artist (Home's Explore Events): no tour, no map,
// and no date arrows since there's no tour to step through. Share points at the venue page, the
// only page these events have, with the event's own title and image in the preview.
export default function ExploreEvent({ event }) {
  const t = useT();
  const { goingConcertIds, toggleGoingConcert } = useContext(AppContext);
  const venue = event._embedded?.venues?.[0];
  const imGoing = goingConcertIds.includes(event.id);
  const venuePath = venue?.id && `/venues/ticketmaster:${venue.id}`;

  const shareUrl = new URL(venuePath || "/", window.location.origin).href;
  const shareText = `${artistOf(event)} · ${dateLabel(event.dateObj)}${venue?.name ? ` · ${venue.name}` : ""}`;

  return (
    <div className="px-2 py-3 sm:px-4">
      <ol className="min-w-0">
        <li className="flex justify-center gap-1 border-y border-zinc-300/50 py-2">
          <ShareButton
            url={shareUrl}
            title={artistOf(event)}
            text={shareText}
            imageUrl={getBestImage(event.images)}
            label={t("Share this concert")}
          />
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
          {venue?.name && (
            <div>
              <span className="font-semibold">{t("Venue:")}</span>&ensp;
              {venuePath ? (
                <Link to={venuePath} className="text-red-600 hover:text-red-800 transition-colors">
                  {venue.name}
                </Link>
              ) : (
                venue.name
              )}
            </div>
          )}
        </li>
        <li className="border-b border-zinc-300/50 py-2">
          <span className="font-semibold">{t("Location:")}</span>&ensp;
          {[venue?.city?.name, venue?.country?.countryCode].filter(Boolean).join(", ")}
        </li>
        <li className="flex flex-wrap items-center justify-center gap-2 border-b border-zinc-300/50 py-2">
          <TicketOptions event={event} artistName={artistOf(event)} iconOnly />
          <HotelOptions event={event} iconOnly />
          <ConcertReminder event={event} artistName={artistOf(event)} iconOnly />
        </li>
      </ol>
    </div>
  );
}
