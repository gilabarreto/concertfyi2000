import { useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Icon from "../Icon";
import {
  faBackward,
  faForward,
  faLocationDot,
  faPlus,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  getUpcomingConcertsByArtist,
  getPastConcertsByArtist,
  dateLabel,
} from "../../helpers/selectors";
import MapDialog from "./MapDialog";

const GOING_KEY = "goingConcertIds";

function getGoing() {
  return JSON.parse(localStorage.getItem(GOING_KEY) || "[]");
}

export default function NextConcert({ concert, setlist, ticketmaster }) {
  const { artistId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [going, setGoing] = useState(getGoing);
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

  if (!upcomingConcert) return null;

  // Same idea as "I WAS THERE" on Last Concert, mirrored forward: mark locally that the
  // user plans to be at this one. Keyed by the Ticketmaster event id, so flipping between
  // upcoming dates with the arrows above keeps each date's mark separate.
  const imGoing = going.includes(upcomingConcert.id);
  const toggleGoing = () => {
    const next = imGoing
      ? going.filter((id) => id !== upcomingConcert.id)
      : [...going, upcomingConcert.id];
    setGoing(next);
    localStorage.setItem(GOING_KEY, JSON.stringify(next));
  };

  const venue = upcomingConcert._embedded?.venues?.[0];
  const coords = venue?.location;
  // Ticketmaster has no tour field — and what event.name carries instead isn't standardized,
  // each vendor/venue titles its own listing, so it's not a fact worth showing as one. And
  // setlist.fm has no future shows to ask (a concert only gets an entry once someone reports
  // its setlist). So: guess from the artist's most recent past tour, on the bet a tour still
  // running is the one this next date belongs to. No history at all → nothing to guess from.
  const tour = getPastConcertsByArtist(setlist, artistId)[0]?.tour?.name || "N/A";

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-balance">Next Concert</h2>
        <button
          type="button"
          onClick={toggleGoing}
          aria-pressed={imGoing}
          title={imGoing ? "Remove from concerts you're going to" : "Mark that you're going"}
          className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
            imGoing
              ? "border-red-600 text-red-600 hover:bg-red-50"
              : "border-zinc-300 text-zinc-500 hover:border-red-600 hover:text-red-600"
          }`}
        >
          <Icon icon={imGoing ? faCheck : faPlus} className="text-[0.65rem]" />
          I'M GOING
        </button>
      </div>

      <hr className="border-t border-zinc-300 opacity-50 ml-6" />

      <ol className="pl-6">
        <li className="border-b border-zinc-300/50 py-2">
          Concert date:&ensp;
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
        </li>
        <li className="border-b border-zinc-300/50 py-2">Tour:&ensp;{tour}</li>
        <li className="border-b border-zinc-300/50 py-2">Venue:&ensp;{venue?.name}</li>
        <li className="border-b border-zinc-300/50 py-2">
          Location:&ensp;
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
      </ol>

      <MapDialog
        dialogRef={mapRef}
        title={venue?.name || "Venue location"}
        latitude={coords?.latitude}
        longitude={coords?.longitude}
      />
    </>
  );
}
