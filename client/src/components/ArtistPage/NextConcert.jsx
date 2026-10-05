import { useContext, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Icon from "../Icon";
import { faBackward } from "@fortawesome/free-solid-svg-icons/faBackward";
import { faForward } from "@fortawesome/free-solid-svg-icons/faForward";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons/faShareNodes";
import { getPastConcertsByArtist, dateLabel, getBestImage } from "../../helpers/selectors";
import Map from "./Map";
import TourMapPanel from "./TourMapPanel";
import { getTourUpcomingConcerts } from "../../helpers/tourStats";
import { shareOrCopy } from "../../helpers/share";
import CardTitle from "./CardTitle";
import CardNotice from "./CardNotice";
import TicketOptions from "./TicketOptions";
import HotelOptions from "./HotelOptions";
import ConcertReminder from "./ConcertReminder";

import { AppContext } from "../../context/AppContext";

import { useT } from "../../i18n";
export default function NextConcert({ concert, setlist, ticketmaster, hideTitle = false }) {
  const t = useT();
  const { artistId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { goingConcertIds, toggleGoingConcert } = useContext(AppContext);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tourMapOpen, setTourMapOpen] = useState(false);

  // ?next picks which upcoming show this card previews, same idea as :concertId for the
  // Last Concert side — a URL, not local state, because the Share button in the Upcoming
  // Concerts list below just hands out the current URL and expects it to land here.
  const upcomingConcerts = getTourUpcomingConcerts(
    ticketmaster.events,
    concert.artist.name,
    [...setlist, concert],
    searchParams.get("next"),
  );
  const idx = Math.max(
    upcomingConcerts.findIndex((e) => e.id === searchParams.get("next")),
    0,
  );
  const upcomingConcert = upcomingConcerts[idx];
  useEffect(() => setTourMapOpen(false), [upcomingConcert?.id]);
  const select = (id) =>
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("next", id);
      return params;
    });

  if (!upcomingConcert) {
    return hideTitle ? (
      <CardNotice>
        {t("No upcoming concerts available for this artist yet. Check back later.")}
      </CardNotice>
    ) : null;
  }

  // Same idea as "I WAS THERE" on Last Concert, mirrored forward: mark locally that the
  // user plans to be at this one. Keyed by the Ticketmaster event id, so flipping between
  // upcoming dates with the arrows above keeps each date's mark separate.
  const imGoing = goingConcertIds.includes(upcomingConcert.id);
  const toggleGoing = () => toggleGoingConcert(upcomingConcert.id);

  // A URL já leva o ?next deste show, então quem abre cai nesta mesma data.
  const shareVenue = upcomingConcert._embedded?.venues?.[0];
  const shareVars = {
    artist: concert.artist.name,
    city: shareVenue?.city?.name || t("near you"),
    date: dateLabel(upcomingConcert.dateObj),
    venue: shareVenue?.name,
  };
  const shareText = shareVenue?.name
    ? t("{artist} are playing {city} on {date} at {venue}. Are you going?", shareVars)
    : t("{artist} are playing {city} on {date}. Are you going?", shareVars);
  const eventImage = getBestImage(upcomingConcert.images);
  const share = async () => {
    if (
      await shareOrCopy(window.location.href, `${concert.artist.name} concert`, {
        text: shareText,
        imageUrl: eventImage,
      })
    ) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const venue = upcomingConcert._embedded?.venues?.[0];
  const coords = venue?.location;
  // Prefer the selected show's tour; Ticketmaster dates use the most recent known tour.
  const tour =
    upcomingConcert.tourName || getPastConcertsByArtist(setlist, artistId)[0]?.tour?.name || null;

  // No mobile ficam numa linha própria no topo; no desktop, na linha do Concert date.
  const actions = (
    <>
      <button type="button" onClick={share} title={t("Share this concert")} className="pill">
        <Icon icon={linkCopied ? faCheck : faShareNodes} className="text-[0.65rem]" />
        {linkCopied ? t("LINK COPIED") : t("SHARE")}
      </button>
      <button
        type="button"
        onClick={toggleGoing}
        aria-pressed={imGoing}
        title={imGoing ? t("Remove from concerts you're going to") : t("Mark that you're going")}
        className="pill"
      >
        <Icon icon={imGoing ? faCheck : faPlus} className="text-[0.65rem]" />
        {t("I'M GOING")}
      </button>
    </>
  );

  return (
    <>
      {!hideTitle && <CardTitle>{t("Next Concert")}</CardTitle>}

      <div
        className={
          // Mesmas colunas da fileira Setlists/Top Tracks: o gap-4 do grid mais o px-4 dos dois cards.
          hideTitle ? "grid grid-cols-2 items-start gap-x-12" : "grid grid-cols-1 gap-3"
        }
      >
        <ol className={`mx-[12px] min-w-0 ${hideTitle ? "border-t border-zinc-300/50" : ""}`}>
          <li className="flex justify-center gap-1 border-b border-zinc-300/50 py-2">{actions}</li>
          <li className="flex items-center gap-x-3 border-b border-zinc-300/50 py-2">
            <span className="min-w-0">
              <span className="font-semibold">{t("Concert date:")}</span>&ensp;
              {idx > 0 && (
                <Icon
                  icon={faBackward}
                  className="text-xs text-red-600 cursor-pointer mr-2"
                  onClick={() => select(upcomingConcerts[idx - 1].id)}
                />
              )}
              {dateLabel(upcomingConcert.dateObj)}&ensp;
              {idx < upcomingConcerts.length - 1 && (
                <Icon
                  icon={faForward}
                  className="text-xs text-red-600 cursor-pointer"
                  onClick={() => select(upcomingConcerts[idx + 1].id)}
                />
              )}
            </span>
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">{t("Tour:")}</span>&ensp;
            {tour ? (
              <button
                type="button"
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-pressed={tourMapOpen}
                onClick={() => {
                  setTourMapOpen(!tourMapOpen);
                }}
              >
                {tour}
              </button>
            ) : (
              "No tour announced for this concert yet. Check back later."
            )}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">{t("Venue:")}</span>&ensp;
            {venue?.id ? (
              <Link
                to={`/venues/${upcomingConcert.source === "setlistfm" ? venue.id : `ticketmaster:${venue.id}`}`}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                {venue.name}
              </Link>
            ) : (
              venue?.name
            )}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">{t("Location:")}</span>&ensp;
            {coords ? (
              <button
                type="button"
                onClick={() => {
                  setTourMapOpen(false);
                }}
                title={t("Show concert location on map")}
                aria-controls="next-concert-map"
                aria-pressed={!tourMapOpen}
                className="inline align-baseline text-red-600 hover:text-red-800 transition-colors"
              >
                <Icon icon={faLocationDot} className="mr-2" />
                <span>
                  {venue?.city?.name}, {venue?.country?.countryCode}
                </span>
              </button>
            ) : (
              <span>
                {venue?.city?.name}, {venue?.country?.countryCode}
              </span>
            )}
          </li>
          <li className="flex flex-wrap items-center justify-center gap-2 border-b border-zinc-300/50 py-2">
            {upcomingConcert.source !== "setlistfm" && (
              <TicketOptions event={upcomingConcert} artistName={concert.artist.name} iconOnly />
            )}
            <HotelOptions event={upcomingConcert} iconOnly />
            <ConcertReminder event={upcomingConcert} artistName={concert.artist.name} iconOnly />
          </li>
        </ol>
        {(coords || tourMapOpen) && (
          <div
            id="next-concert-map"
            className="mt-[12px] w-full self-start overflow-hidden rounded-md bg-zinc-100"
            aria-label={t("Concert location map")}
          >
            {tourMapOpen ? (
              <TourMapPanel
                artistId={artistId}
                tourName={tour}
                onNavigate={() => {
                  setTourMapOpen(false);
                }}
              />
            ) : (
              <div className="aspect-[103/60] w-full">
                <Map latitude={coords?.latitude} longitude={coords?.longitude} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
