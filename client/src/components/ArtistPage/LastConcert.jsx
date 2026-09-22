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
import ConcertRatingDialog from "./ConcertRatingDialog";
import ConcertComments from "./ConcertComments";

const ATTENDED_KEY = "attendedConcertIds";

function getAttended() {
  return JSON.parse(localStorage.getItem(ATTENDED_KEY) || "[]");
}

export default function LastConcert({ concert, setlist }) {
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
    if (!wasThere) ratingRef.current.showModal();
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-3xl font-bold text-balance">Last Concert</h2>
        {/* Marca localmente que o usuário esteve neste show — sem conta de usuário ainda,
            guardado por navegador em vez de por pessoa. */}
        <button
          type="button"
          onClick={toggleWasThere}
          aria-pressed={wasThere}
          title={wasThere ? "Remove from concerts you attended" : "Mark that you were there"}
          className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
            wasThere
              ? "border-red-600 text-red-600 hover:bg-red-50"
              : "border-gray-300 text-gray-500 hover:border-red-600 hover:text-red-600"
          }`}
        >
          <Icon icon={wasThere ? faCheck : faPlus} className="text-[0.65rem]" />I WAS THERE
        </button>
      </div>

      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      <ol className="pl-6">
        <li className="border-b border-gray-300/50 py-2">
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
        </li>
        <li className="border-b border-gray-300/50 py-2">Tour:&ensp;{tour}</li>
        <li className="border-b border-gray-300/50 py-2">Venue:&ensp;{venue}</li>
        <li className="border-b border-gray-300/50 py-2">
          Location:&ensp;
          {coords ? (
            <button
              type="button"
              onClick={() => mapRef.current.showModal()}
              title="View on map"
              aria-haspopup="dialog"
              className="inline align-baseline text-red-600 hover:text-red-800 hover:underline transition-colors"
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
      </ol>

      {(reviews.length > 0 || wasThere) && (
        <div className="pl-6">
          {reviews.length > 0 ? (
            <ConcertComments reviews={reviews} key={concert.id} />
          ) : (
            <button
              type="button"
              onClick={() => ratingRef.current.showModal()}
              className="mt-2 text-xs text-red-600 hover:text-red-800 font-semibold"
            >
              Rate this concert
            </button>
          )}
        </div>
      )}

      <MapDialog
        dialogRef={mapRef}
        title={venue || "Venue location"}
        latitude={coords?.lat}
        longitude={coords?.long}
      />

      <ConcertRatingDialog dialogRef={ratingRef} concertId={concert.id} onSaved={setReviews} />
    </>
  );
}
