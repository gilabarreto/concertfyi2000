import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../Icon";
import {
  faBackward,
  faForward,
  faPlus,
  faCheck,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { getPastConcertsByArtist, parseSetlistDate, dateLabel } from "../../helpers/selectors";
import { getReviews } from "../../helpers/concertReviews";
import MapDialog from "./MapDialog";
import Map from "./Map";
import ConcertRatingDialog from "./ConcertRatingDialog";
import ConcertComments from "./ConcertComments";

const ATTENDED_KEY = "attendedConcertIds";

function getAttended() {
  return JSON.parse(localStorage.getItem(ATTENDED_KEY) || "[]");
}

export default function LastConcert({ concert, setlist, hideTitle = false }) {
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();
  const [attended, setAttended] = useState(getAttended);
  const [reviews, setReviews] = useState(() => getReviews(concert.id));
  const mapRef = useRef(null);
  const ratingRef = useRef(null);

  // Prev/next arrows below swap `concert` without remounting this component — reload
  // whichever concert's reviews we're now looking at instead of carrying the old ones.
  useEffect(() => setReviews(getReviews(concert.id)), [concert.id]);

  const wasThere = attended.includes(concert.id);
  const toggleWasThere = () => {
    const next = wasThere ? attended.filter((id) => id !== concert.id) : [...attended, concert.id];
    setAttended(next);
    localStorage.setItem(ATTENDED_KEY, JSON.stringify(next));
    // Just marked as attended: prompt for a rating right away rather than leaving it
    // to be found later.
    if (!wasThere) ratingRef.current.open("rate");
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

  return (
    <>
      {!hideTitle && <h2 className="text-2xl font-bold text-balance mb-4">Last Concert</h2>}

      <div
        className={
          hideTitle && coords ? "grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6" : ""
        }
      >
        <ol className="min-w-0 pl-6 border-t border-zinc-300/50">
          <li className="flex items-center justify-between gap-2 border-b border-zinc-300/50 py-2">
            <span className="min-w-0">
              Concert date:&ensp;
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
            <button
              type="button"
              onClick={toggleWasThere}
              aria-pressed={wasThere}
              title={wasThere ? "Remove from concerts you attended" : "Mark that you were there"}
              className={`flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] leading-4 whitespace-nowrap transition-colors ${
                wasThere
                  ? "border-red-600 text-red-600 hover:bg-red-50"
                  : "border-zinc-300 text-zinc-500 hover:border-red-600 hover:text-red-600"
              }`}
            >
              <Icon icon={wasThere ? faCheck : faPlus} className="text-[0.65rem]" />I WAS THERE
            </button>
          </li>
          <li className="border-b border-zinc-300/50 py-2">Tour:&ensp;{tour}</li>
          <li className="border-b border-zinc-300/50 py-2">Venue:&ensp;{venue}</li>
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
        {hideTitle && coords && (
          <div
            className="min-h-[180px] overflow-hidden rounded-md bg-zinc-100"
            aria-label="Concert location map"
          >
            <Map latitude={coords?.lat} longitude={coords?.long} />
          </div>
        )}
      </div>

      <MapDialog
        dialogRef={mapRef}
        title={venue || "Venue location"}
        latitude={coords?.lat}
        longitude={coords?.long}
      />

      <ConcertRatingDialog ref={ratingRef} concertId={concert.id} onSaved={setReviews} />
    </>
  );
}
