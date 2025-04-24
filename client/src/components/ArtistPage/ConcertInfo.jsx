import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackward, faForward } from "@fortawesome/free-solid-svg-icons";

export default function ConcertInfo(props) {
  const { setlist, concert, ticketmaster } = props;
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();
  const { state } = useLocation();
  const artistImage = state?.artistImage;

  //Filter setlsit by artist id
  let previousConcertId;
  let nextConcertId;
  const filteredConcerts = setlist.filter(
    (item) => item.artist.mbid === artistId
  );
  //Find in data the matching concert id
  filteredConcerts.find((result, index, arr) => {
    if (result.id === concertId) {
      previousConcertId = arr[index + 1]?.id;
      let nextConcert = arr[index - 1];
      if (nextConcert) {
        const [day, month, year] = nextConcert.eventDate.split("-");
        const nextConcertDate = new Date(year, month - 1, day);
        if (nextConcertDate < new Date()) {
          nextConcertId = nextConcert.id;
        }
      }
      return true;
    }
    return false;
  });

  const concertDate = () => {
    const [day, month, year] = concert.eventDate.split("-");
    const mainConcertDate = new Date(year, month - 1, day);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return mainConcertDate.toLocaleDateString("en-US", options);
  };

  //——— now ConcertInfo’s data
  const artist = concert.artist.name;
  const tour = concert.tour?.name || "No tour name";
  const venue = concert.venue?.name;
  const city = concert.venue.city?.name;
  const stateCode = concert.venue.city?.state;
  const country = concert.venue.city?.country.code;

  return (
    <>
      {/* ----- ConcertDate JSX ----- */}
      <div className="flex-1 flex items-center justify-between space-x-6">
        <div className="flex-1">
          {artistImage && (
            <img
              src={artistImage}
              alt="Artist"
              className="object-cover rounded-md"
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-1 justify-around">
            <h2 className="flex-1 text-4xl font-bold">{artist}</h2>
            <span className="flex items-end">
              {ticketmaster.attractions ? (
                <a
                  href={
                    ticketmaster.attractions[0].externalLinks.youtube[0].url
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <FontAwesomeIcon icon="fa-brands fa-youtube" size="2x" />
                </a>
              ) : null}
              {ticketmaster.attractions ? (
                <a
                  href={
                    ticketmaster.attractions[0].externalLinks.instagram[0].url
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  &ensp;
                  <FontAwesomeIcon icon="fa-brands fa-instagram" size="2x" />
                </a>
              ) : null}
              {ticketmaster.attractions ? (
                <a
                  href={
                    ticketmaster.attractions[0].externalLinks.twitter[0].url
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  &ensp;
                  <FontAwesomeIcon icon="fa-brands fa-twitter" size="2x" />
                </a>
              ) : null}
            </span>
          </div>
          <br></br>

          <ol className="pl-6">
            <hr className="border-t border-gray-300 opacity-50"></hr>
            <h2 className="artist-page-button-aligner">
              Concert date:&ensp;
              {previousConcertId && (
                <FontAwesomeIcon
                  icon={faBackward}
                  className="text-xs text-red-600 cursor-pointer mr-2"
                  onClick={() => {
                    navigate(
                      `/artists/${artistId}/concerts/${previousConcertId}`,
                      { state: { artistImage } }
                    );
                  }}
                />
              )}
              {concertDate()}&ensp;
              {nextConcertId && (
                <FontAwesomeIcon
                  icon={faForward}
                  className="text-xs text-red-600 cursor-pointer"
                  onClick={() => {
                    navigate(`/artists/${artistId}/concerts/${nextConcertId}`, {
                      state: { artistImage },
                    });
                  }}
                />
              )}
            </h2>
            <hr className="border-t border-gray-300 opacity-50"></hr>
            <h2 className="tour">Tour:&ensp;{tour}</h2>
            <hr className="border-t border-gray-300 opacity-50"></hr>
            <h2>Venue:&ensp;{venue}</h2>
            <hr className="border-t border-gray-300 opacity-50"></hr>
            <h2>
              Location:&ensp;{city}, {stateCode}, {country}
            </h2>
            <hr className="border-t border-gray-300 opacity-50"></hr>
          </ol>
        </div>
      </div>
    </>
  );
}
