import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackward, faForward } from "@fortawesome/free-solid-svg-icons";
import { getBestImage } from "../../helpers/selectors";
import { getPreviousConcertsByArtist } from "../../helpers/selectors";

export default function ConcertInfo(props) {
  const { concert, setlist, ticketmaster, artistImage } = props;
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();

  const imagesArray = Array.isArray(artistImage)
    ? artistImage
    : ticketmaster.attractions?.[0]?.images || [];

  const bestImageUrl = getBestImage(imagesArray);

  const previousConcerts = getPreviousConcertsByArtist(setlist, artistId);

  useEffect(() => {
    if (!previousConcerts.length) return;
    const latestId = String(previousConcerts[0].id);
    if (String(concertId) !== latestId) {
      navigate(
        `/artists/${artistId}/concerts/${latestId}`,
        { replace: true, state: { artistImage } }
      );
    }
  }, []);

  const idx = previousConcerts.findIndex(
    (c) => String(c.id) === String(concertId)
  );
  const previousConcertId = previousConcerts[idx + 1]?.id;
  const nextConcertId = previousConcerts[idx - 1]?.id;

  const concertDate = () => {
    const [day, month, year] = concert.eventDate.split("-");
    const mainConcertDate = new Date(year, month - 1, day);
    return mainConcertDate.toLocaleDateString("en-US", {
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
    <div className="flex-1 flex items-center justify-between space-x-6">
      <div className="flex-1 flex justify-center">
        {bestImageUrl && (
          <img
            src={bestImageUrl}
            alt={`${artist} portrait`}
            className="object-cover rounded-md max-w-[300px] w-full h-auto"
          />
        )}
      </div>

      <div className="flex-1">
        <div className="flex flex-1 justify-around mb-4">
          <h2 className="flex-1 text-4xl font-bold">{artist}</h2>
          <span className="flex items-end">
            <FontAwesomeIcon
              icon="fa-solid fa-heart"
              className="text-gray-500"
              size="2x"
            />
          </span>
        </div>

        <ol className="pl-6">
          <hr className="border-t border-gray-300 opacity-50" />
          <h2 className="artist-page-button-aligner">
            Concert date:&ensp;
            {previousConcertId && (
              <FontAwesomeIcon
                icon={faBackward}
                className="text-xs text-red-600 cursor-pointer mr-2"
                onClick={() =>
                  navigate(
                    `/artists/${artistId}/concerts/${previousConcertId}`,
                    { state: { artistImage } }
                  )
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
          <h2>
            Location:&ensp;{city}, {country}
          </h2>
          <hr className="border-t border-gray-300 opacity-50" />
        </ol>

        <span className="flex justify-center mt-4 space-x-4">
          {ticketmaster.attractions?.[0]?.externalLinks?.youtube && (
            <a
              href={ticketmaster.attractions[0].externalLinks.youtube[0].url}
              target="_blank"
              rel="noreferrer"
            >
              <FontAwesomeIcon
                icon="fa-brands fa-youtube"
                className="text-gray-500"
                size="2x"
              />
            </a>
          )}
          {ticketmaster.attractions?.[0]?.externalLinks.instagram && (
            <a
              href={ticketmaster.attractions[0].externalLinks.instagram[0].url}
              target="_blank"
              rel="noreferrer"
            >
              <FontAwesomeIcon
                icon="fa-brands fa-instagram"
                className="text-gray-500"
                size="2x"
              />
            </a>
          )}
          {ticketmaster.attractions?.[0]?.externalLinks.twitter && (
            <a
              href={ticketmaster.attractions[0].externalLinks.twitter[0].url}
              target="_blank"
              rel="noreferrer"
            >
              <FontAwesomeIcon
                icon="fa-brands fa-twitter"
                className="text-gray-500"
                size="2x"
              />
            </a>
          )}
        </span>
      </div>
    </div>
  );
}
