import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";

export default function PreviousConcerts(props) {
  const navigate = useNavigate();

  const filteredConcerts = props.setlist
    .filter((item) => item.artist.mbid === props.artistId)
    .filter((concert) => {
      const [day, month, year] = concert.eventDate.split("-");
      const date = new Date(year, month - 1, day);
      return date < new Date(); // only past shows
    })
    .slice(0, 5); // limit to 10 most recent

  return (
    <>
      <h2 className="text-4xl font-bold mb-4">Previous Concerts</h2>
      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      {filteredConcerts.length === 0 ? (
        <p className="py-2">
          There are no previous concerts. Please come back later.
        </p>
      ) : (
        <ol className="pl-6">
          {filteredConcerts.map((concert) => {
            const [day, month, year] = concert.eventDate.split("-");
            const date = new Date(year, month - 1, day);
            const options = { year: "numeric", month: "long", day: "numeric" };
            const city = concert.venue.city?.name || "";
            const state = concert.venue.city?.state || "";
            const country = concert.venue.city?.country.code || "";

            const concertLabel = `${date.toLocaleDateString(
              "en-US",
              options
            )} - ${city}, ${state}, ${country}`;

            return (
              <li
                key={concert.id}
                className="flex items-center justify-between border-b border-gray-300/50 py-1"
              >
                <span
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/artists/${props.artistId}/concerts/${concert.id}`
                    )
                  }
                >
                  {concertLabel}
                </span>
                <span>
                  <FontAwesomeIcon
                    icon={faRotateLeft}
                    className="text-red-600 hover:text-red-800"
                    onClick={() =>
                      navigate(
                        `/artists/${props.artistId}/concerts/${concert.id}`
                      )
                    }
                  />
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
