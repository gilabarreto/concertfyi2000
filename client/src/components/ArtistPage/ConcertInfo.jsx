import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackward, faForward } from "@fortawesome/free-solid-svg-icons";
import { getBestImage } from "../../helpers/selectors";
import { getLastConcertsByArtist } from "../../helpers/selectors";

export default function ConcertInfo(props) {
  const { concert, setlist, ticketmaster, artistImage } = props;
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();

  const imagesArray = Array.isArray(artistImage)
    ? artistImage
    : ticketmaster.attractions?.[0]?.images || [];

  const bestImageUrl = getBestImage(imagesArray);

  const lastConcerts = getLastConcertsByArtist(setlist, artistId);

  useEffect(() => {
    if (!lastConcerts.length) return;
    const latestId = String(lastConcerts[0].id);
    if (String(concertId) !== latestId) {
      navigate(`/artists/${artistId}/concerts/${latestId}`, {
        replace: true,
        state: { artistImage },
      });
    }
  }, []);

  const idx = lastConcerts.findIndex((c) => String(c.id) === String(concertId));
  const lastConcertId = lastConcerts[idx + 1]?.id;
  const nextConcertId = lastConcerts[idx - 1]?.id;

  const concertDate = () => {
    const [day, month, year] = concert.eventDate.split("-");
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const artist = concert.artist.name;
  const tour = concert.tour?.name || "No tour name";
  const venue = concert.venue?.name;
  const city = concert.venue.city?.name;
  const country = concert.venue.city?.country.code;

  return (
    <div className="flex-1 flex flex-col items-center sm:flex-row justify-between space-y-6 sm:space-y-0 sm:space-x-6">
      <div className="flex-1 flex justify-center sm:justify-start">
        {bestImageUrl && (
          <img
            src={bestImageUrl}
            alt={`${artist} portrait`}
            className="object-cover w-full h-full sm:max-w-[300px] sm:h-auto rounded-md"
          />
        )}
      </div>

      <div className="flex-1 w-full sm:w-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-4xl font-bold">{artist}</h2>
          <FontAwesomeIcon
            icon="fa-solid fa-heart"
            className="cursor-pointer text-gray-500"
            size="2x"
          />
        </div>

        <ol className="pl-6">
          <hr className="border-t border-gray-300 opacity-50" />

          <h2 className="artist-page-button-aligner">
            Concert date:&ensp;
            {lastConcertId && (
              <FontAwesomeIcon
                icon={faBackward}
                className="text-xs text-red-600 cursor-pointer mr-2"
                onClick={() =>
                  navigate(`/artists/${artistId}/concerts/${lastConcertId}`, {
                    state: { artistImage },
                  })
                }
              />
            )}
            {concertDate()}&ensp;
            {nextConcertId && (
              <FontAwesomeIcon
                icon={faForward}
                className="text-xs text-red-600 cursor-pointer"
                onClick={() =>
                  navigate(`/artists/${artistId}/concerts/${nextConcertId}`, {
                    state: { artistImage },
                  })
                }
              />
            )}
          </h2>

          <hr className="border-t border-gray-300 opacity-50" />
          <h2 className="tour">Tour:&ensp;{tour}</h2>
          <hr className="border-t border-gray-300 opacity-50" />
          <h2>Venue:&ensp;{venue}</h2>
          <hr className="border-t border-gray-300 opacity-50" />
          <h2>Location:&ensp;{city}, {country}</h2>
          <hr className="border-t border-gray-300 opacity-50" />
        </ol>

        <span className="flex justify-center mt-4 space-x-4">
          {ticketmaster.attractions?.[0]?.externalLinks?.youtube && (
            <a
              href={ticketmaster.attractions[0].externalLinks.youtube[0].url}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
            >
              <FontAwesomeIcon icon="fa-brands fa-youtube" className="text-gray-500" size="2x" />
            </a>
          )}
          {ticketmaster.attractions?.[0]?.externalLinks?.instagram && (
            <a
              href={ticketmaster.attractions[0].externalLinks.instagram[0].url}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <FontAwesomeIcon icon="fa-brands fa-instagram" className="text-gray-500" size="2x" />
            </a>
          )}
          {ticketmaster.attractions?.[0]?.externalLinks?.twitter && (
            <a
              href={ticketmaster.attractions[0].externalLinks.twitter[0].url}
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
            >
              <FontAwesomeIcon icon="fa-brands fa-twitter" className="text-gray-500" size="2x" />
            </a>
          )}
        </span>
      </div>
    </div>
  );
}
