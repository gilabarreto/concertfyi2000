import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../Icon";
import {
  faBackward,
  faForward,
  faPlus,
  faCheck,
  faLocationDot,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { getPastConcertsByArtist, parseSetlistDate, dateLabel } from "../../helpers/selectors";
import { getReviews } from "../../helpers/concertReviews";
import MapDialog from "./MapDialog";
import Map from "./Map";
import TourMapPanel from "./TourMapPanel";
import ConcertRatingDialog from "./ConcertRatingDialog";
import ConcertComments from "./ConcertComments";
import { getTicketmasterEventImage, shareOrCopy } from "../../helpers/share";
import CardTitle from "./CardTitle";

const ATTENDED_KEY = "attendedConcertIds";

function getAttended() {
  return JSON.parse(localStorage.getItem(ATTENDED_KEY) || "[]");
}

export default function LastConcert({
  concert,
  setlist,
  ticketmaster,
  fallbackImage,
  hideTitle = false,
}) {
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();
  const [attended, setAttended] = useState(getAttended);
  const [linkCopied, setLinkCopied] = useState(false);
  const [reviews, setReviews] = useState(() => getReviews(concert.id));
  const mapRef = useRef(null);
  const [tourMapOpen, setTourMapOpen] = useState(false);
  const ratingRef = useRef(null);

  // Prev/next arrows below swap `concert` without remounting this component — reload
  // whichever concert's reviews we're now looking at instead of carrying the old ones.
  useEffect(() => {
    setReviews(getReviews(concert.id));
    setTourMapOpen(false);
  }, [concert.id]);

  const wasThere = attended.includes(concert.id);
  const toggleWasThere = () => {
    const next = wasThere ? attended.filter((id) => id !== concert.id) : [...attended, concert.id];
    setAttended(next);
    localStorage.setItem(ATTENDED_KEY, JSON.stringify(next));
    // Just marked as attended: prompt for a rating right away rather than leaving it
    // to be found later.
    if (!wasThere) ratingRef.current.open("rate");
  };

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

  const pastConcerts = getPastConcertsByArtist(setlist, artistId);

  const idx = pastConcerts.findIndex((c) => String(c.id) === String(concertId));
  const lastConcertId = pastConcerts[idx + 1]?.id;
  const nextConcertId = pastConcerts[idx - 1]?.id;

  const tour = concert.tour?.name || "N/A";
  const venue = concert.venue?.name;
  const city = concert.venue.city?.name;
  const country = concert.venue.city?.country.code;
  const coords = concert.venue.city?.coords;
  const localDate = concert.eventDate.split("-").reverse().join("-");
  const eventImage =
    getTicketmasterEventImage(ticketmaster?.events, concert.artist.name, localDate, venue) ||
    fallbackImage;
  const shareText = `${concert.artist.name} played ${city || "near you"} on ${dateLabel(parseSetlistDate(concert.eventDate))}${venue ? ` at ${venue}` : ""}. Were you there?`;

  // No mobile ficam numa linha própria no topo; no desktop, na linha do Concert date.
  const actions = (
    <>
      <button
        type="button"
        onClick={share}
        title="Share this concert"
        className={`flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border text-[12px] leading-4 whitespace-nowrap transition-colors border-zinc-300 text-zinc-500 hover:border-red-600 hover:text-red-600`}
      >
        <Icon icon={linkCopied ? faCheck : faShareNodes} className="text-[0.65rem]" />
        {linkCopied ? "LINK COPIED" : "SHARE"}
      </button>
      <button
        type="button"
        onClick={toggleWasThere}
        aria-pressed={wasThere}
        title={wasThere ? "Remove from concerts you attended" : "Mark that you were there"}
        className={`flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border text-[12px] leading-4 whitespace-nowrap transition-colors ${
          wasThere
            ? "border-red-600 text-red-600 hover:bg-red-50"
            : "border-zinc-300 text-zinc-500 hover:border-red-600 hover:text-red-600"
        }`}
      >
        <Icon icon={wasThere ? faCheck : faPlus} className="text-[0.65rem]" />I WAS THERE
      </button>
    </>
  );

  return (
    <>
      {!hideTitle && <CardTitle>Last Concert</CardTitle>}

      <div
        className={
          // Mesmas colunas da fileira Setlists/Top Tracks: o gap-4 do grid mais o px-4 dos dois cards.
          hideTitle ? "grid grid-cols-2 items-start gap-x-12" : ""
        }
      >
        <ol className={`mx-[12px] min-w-0 ${hideTitle ? "border-t border-zinc-300/50" : ""}`}>
          <li className="flex justify-center gap-1 border-b border-zinc-300/50 py-2">{actions}</li>
          <li className="flex items-center gap-x-3 border-b border-zinc-300/50 py-2">
            <span className="min-w-0">
              <span className="font-semibold">Concert date:</span>&ensp;
              {lastConcertId && (
                <Icon
                  icon={faBackward}
                  className="text-xs text-red-600 cursor-pointer mr-2"
                  onClick={() => navigate(`/artists/${artistId}/concerts/${lastConcertId}`)}
                />
              )}
              {dateLabel(parseSetlistDate(concert.eventDate))}&ensp;
              {nextConcertId && (
                <Icon
                  icon={faForward}
                  className="text-xs text-red-600 cursor-pointer"
                  onClick={() => navigate(`/artists/${artistId}/concerts/${nextConcertId}`)}
                />
              )}
            </span>
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">Tour:</span>&ensp;
            {tour !== "N/A" ? (
              <button
                type="button"
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-pressed={tourMapOpen}
                onClick={() => {
                  setTourMapOpen(hideTitle ? !tourMapOpen : true);
                  if (!hideTitle) mapRef.current.showModal();
                }}
              >
                {tour}
              </button>
            ) : (
              tour
            )}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">Venue:</span>&ensp;{venue}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">Location:</span>&ensp;
            {coords ? (
              <button
                type="button"
                onClick={() => {
                  setTourMapOpen(false);
                  mapRef.current.showModal();
                }}
                title="View on map"
                aria-haspopup="dialog"
                className="inline align-baseline text-red-600 hover:text-red-800 transition-colors"
              >
                <Icon icon={faLocationDot} className="mr-2" />
                <span>
                  {city}, {country}
                </span>
              </button>
            ) : (
              <span>
                {city}, {country}
              </span>
            )}
          </li>

          <ConcertComments
            concertId={concert.id}
            reviews={reviews}
            onSaved={setReviews}
            onLeaveReview={() => ratingRef.current.open("comment")}
            key={concert.id}
          />
        </ol>
        {hideTitle && (coords || tourMapOpen) && (
          <div
            className="mt-[12px] w-full self-start overflow-hidden rounded-md bg-zinc-100"
            aria-label="Concert location map"
          >
            {tourMapOpen ? (
              <TourMapPanel
                artistId={artistId}
                tourName={tour}
                onNavigate={() => {
                  mapRef.current?.close();
                  setTourMapOpen(false);
                }}
              />
            ) : (
              <div className="aspect-[103/60] w-full">
                <Map latitude={coords?.lat} longitude={coords?.long} />
              </div>
            )}
          </div>
        )}
      </div>

      <MapDialog
        dialogRef={mapRef}
        title={tourMapOpen ? tour : venue || "Venue location"}
        latitude={coords?.lat}
        longitude={coords?.long}
      >
        {tourMapOpen && !hideTitle && (
          <TourMapPanel
            popup
            artistId={artistId}
            tourName={tour}
            onNavigate={() => {
              mapRef.current?.close();
              setTourMapOpen(false);
            }}
          />
        )}
      </MapDialog>

      <ConcertRatingDialog ref={ratingRef} concertId={concert.id} onSaved={setReviews} />
    </>
  );
}
