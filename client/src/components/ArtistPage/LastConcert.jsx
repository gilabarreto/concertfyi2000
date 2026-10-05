import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../Icon";
import { faBackward } from "@fortawesome/free-solid-svg-icons/faBackward";
import { faForward } from "@fortawesome/free-solid-svg-icons/faForward";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons/faShareNodes";
import { getPastConcertsByArtist, parseSetlistDate, dateLabel } from "../../helpers/selectors";
import { getReviews } from "../../helpers/concertReviews";
import Map from "./Map";
import TourMapPanel from "./TourMapPanel";
import ConcertRatingDialog from "./ConcertRatingDialog";
import ConcertComments from "./ConcertComments";
import { getTicketmasterEventImage, shareOrCopy } from "../../helpers/share";
import CardTitle from "./CardTitle";

import { useT } from "../../i18n";
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
  const t = useT();
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();
  const [attended, setAttended] = useState(getAttended);
  const [linkCopied, setLinkCopied] = useState(false);
  const [reviews, setReviews] = useState(() => getReviews(concert.id));
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

  const tour = concert.tour?.name || null;
  const venue = concert.venue?.name;
  const city = concert.venue.city?.name;
  const country = concert.venue.city?.country.code;
  const coords = concert.venue.city?.coords;
  const localDate = concert.eventDate.split("-").reverse().join("-");
  const eventImage =
    getTicketmasterEventImage(ticketmaster?.events, concert.artist.name, localDate, venue) ||
    fallbackImage;
  const shareVars = {
    artist: concert.artist.name,
    city: city || t("near you"),
    date: dateLabel(parseSetlistDate(concert.eventDate)),
    venue,
  };
  const shareText = venue
    ? t("{artist} played {city} on {date} at {venue}. Were you there?", shareVars)
    : t("{artist} played {city} on {date}. Were you there?", shareVars);

  // No mobile ficam numa linha própria no topo; no desktop, na linha do Concert date.
  const actions = (
    <>
      <button type="button" onClick={share} title={t("Share this concert")} className="pill">
        <Icon icon={linkCopied ? faCheck : faShareNodes} className="text-[0.65rem]" />
        {linkCopied ? t("LINK COPIED") : t("SHARE")}
      </button>
      <button
        type="button"
        onClick={toggleWasThere}
        aria-pressed={wasThere}
        title={wasThere ? t("Remove from concerts you attended") : t("Mark that you were there")}
        className="pill"
      >
        <Icon icon={wasThere ? faCheck : faPlus} className="text-[0.65rem]" />
        {t("I WAS THERE")}
      </button>
    </>
  );

  return (
    <>
      {!hideTitle && <CardTitle>{t("Last Concert")}</CardTitle>}

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
              "No tour listed for this concert."
            )}
          </li>
          <li className="border-b border-zinc-300/50 py-2">
            <span className="font-semibold">{t("Venue:")}</span>&ensp;
            {concert.venue?.id ? (
              <Link
                to={`/venues/${concert.venue.id}`}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                {venue}
              </Link>
            ) : (
              venue
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
                aria-controls="last-concert-map"
                aria-pressed={!tourMapOpen}
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
        {(coords || tourMapOpen) && (
          <div
            id="last-concert-map"
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
                <Map latitude={coords?.lat} longitude={coords?.long} />
              </div>
            )}
          </div>
        )}
      </div>

      <ConcertRatingDialog ref={ratingRef} concertId={concert.id} onSaved={setReviews} />
    </>
  );
}
