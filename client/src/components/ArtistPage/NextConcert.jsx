import { useContext, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Icon from "../Icon";
import {
  faBackward,
  faForward,
  faLocationDot,
  faPlus,
  faCheck,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import {
  getUpcomingConcertsByArtist,
  getPastConcertsByArtist,
  dateLabel,
  getBestImage,
} from "../../helpers/selectors";
import MapDialog from "./MapDialog";
import Map from "./Map";
import { shareOrCopy } from "../../helpers/share";
import CardTitle from "./CardTitle";
import TicketOptions from "./TicketOptions";
import HotelOptions from "./HotelOptions";
import ConcertReminder from "./ConcertReminder";

import { AppContext } from "../../context/AppContext";

export default function NextConcert({ concert, setlist, ticketmaster, hideTitle = false }) {
  const { artistId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { goingConcertIds, toggleGoingConcert } = useContext(AppContext);
  const [linkCopied, setLinkCopied] = useState(false);
  const mapRef = useRef(null);

  // ?next picks which upcoming show this card previews, same idea as :concertId for the
  // Last Concert side — a URL, not local state, because the Share button in the Upcoming
  // Concerts list below just hands out the current URL and expects it to land here.
  const upcomingConcerts = getUpcomingConcertsByArtist(ticketmaster.events, concert.artist.name);
  const idx = Math.max(
    upcomingConcerts.findIndex((e) => e.id === searchParams.get("next")),
    0,
  );
  const upcomingConcert = upcomingConcerts[idx];
  const select = (id) =>
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("next", id);
      return params;
    });

  if (!upcomingConcert) {
    return hideTitle ? (
      <p className="py-8 text-center text-zinc-500">No upcoming concerts. Check back later.</p>
    ) : null;
  }

  // Same idea as "I WAS THERE" on Last Concert, mirrored forward: mark locally that the
  // user plans to be at this one. Keyed by the Ticketmaster event id, so flipping between
  // upcoming dates with the arrows above keeps each date's mark separate.
  const imGoing = goingConcertIds.includes(upcomingConcert.id);
  const toggleGoing = () => toggleGoingConcert(upcomingConcert.id);

  // A URL já leva o ?next deste show, então quem abre cai nesta mesma data.
  const shareText = `${concert.artist.name} are playing ${upcomingConcert._embedded?.venues?.[0]?.city?.name || "near you"} on ${dateLabel(upcomingConcert.dateObj)}${upcomingConcert._embedded?.venues?.[0]?.name ? ` at ${upcomingConcert._embedded.venues[0].name}` : ""}. Are you going?`;
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
  // Ticketmaster has no tour field — and what event.name carries instead isn't standardized,
  // each vendor/venue titles its own listing, so it's not a fact worth showing as one. And
  // setlist.fm has no future shows to ask (a concert only gets an entry once someone reports
  // its setlist). So: guess from the artist's most recent past tour, on the bet a tour still
  // running is the one this next date belongs to. No history at all → nothing to guess from.
  const tour = getPastConcertsByArtist(setlist, artistId)[0]?.tour?.name || "N/A";

  // No mobile ficam numa linha própria no topo; no desktop, na linha do Concert date.
  const actions = (
    <>
      <button
        type="button"
        onClick={share}
        title="Share this concert"
        className="flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border text-[12px] leading-4 whitespace-nowrap transition-colors border-zinc-300 text-zinc-500 hover:border-red-600 hover:text-red-600"
      >
        <Icon icon={linkCopied ? faCheck : faShareNodes} className="text-[0.65rem]" />
        {linkCopied ? "LINK COPIED" : "SHARE"}
      </button>
      <button
        type="button"
        onClick={toggleGoing}
        aria-pressed={imGoing}
        title={imGoing ? "Remove from concerts you're going to" : "Mark that you're going"}
        className={`flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border text-[12px] leading-4 whitespace-nowrap transition-colors ${
          imGoing
            ? "border-red-600 text-red-600 hover:bg-red-50"
            : "border-zinc-300 text-zinc-500 hover:border-red-600 hover:text-red-600"
        }`}
      >
        <Icon icon={imGoing ? faCheck : faPlus} className="text-[0.65rem]" />
        I'M GOING
      </button>
    </>
  );

  return (
    <>
      {!hideTitle && <CardTitle>Next Concert</CardTitle>}

      <div
        className={
          // Mesmas colunas da fileira Setlists/Top Tracks: o gap-6 do grid mais o p-4 dos dois cards.
          hideTitle ? "grid grid-cols-2 items-start gap-x-14" : ""
        }
      >
        <ol className={`mx-[12px] min-w-0 ${hideTitle ? "border-t border-zinc-300/50" : ""}`}>
          {!hideTitle && (
            <li className="flex justify-center gap-1 border-b border-zinc-300/50 py-2">
              {actions}
            </li>
          )}
          <li className="flex items-center gap-x-3 border-b border-zinc-300/50 py-2">
            <span className="min-w-0">
              <span className="font-semibold">Concert date:</span>&ensp;
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
            {hideTitle && <span className="ml-auto flex gap-1">{actions}</span>}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">Tour:</span>&ensp;{tour}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">Venue:</span>&ensp;{venue?.name}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">Location:</span>&ensp;
            {coords ? (
              <button
                type="button"
                onClick={() => mapRef.current.showModal()}
                title="View on map"
                aria-haspopup="dialog"
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
          <li className="border-b border-zinc-300/50 py-2">
            <TicketOptions event={upcomingConcert} artistName={concert.artist.name} iconOnly />
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <HotelOptions event={upcomingConcert} iconOnly />
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <ConcertReminder event={upcomingConcert} artistName={concert.artist.name} iconOnly />
          </li>
        </ol>
        {hideTitle && coords && (
          <div
            className="mt-[12px] aspect-[103/60] w-full self-start overflow-hidden rounded-md bg-zinc-100"
            aria-label="Concert location map"
          >
            <Map latitude={coords?.latitude} longitude={coords?.longitude} />
          </div>
        )}
      </div>

      <MapDialog
        dialogRef={mapRef}
        title={venue?.name || "Venue location"}
        latitude={coords?.latitude}
        longitude={coords?.longitude}
      />
    </>
  );
}
