import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { getPastConcertsByArtist } from "../../helpers/selectors";
import ConcertList from "./ConcertList";

export default function PastConcerts(props) {
  return (
    <ConcertList
      title="Past Concerts"
      empty="No recent concerts. Check back later."
      items={getPastConcertsByArtist(props.setlist, props.artistId)}
      locationOf={(concert) =>
        `${concert.venue.city?.name || ""}, ${concert.venue.city?.country.code || ""}`
      }
      iconTitle="Show concert options"
      expand={(concert) => (
        <div className="px-2 py-3 sm:px-4">
          <Link
            to={`/artists/${props.artistId}/concerts/${concert.id}`}
            className="w-full px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-700 rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Icon icon={faRotateLeft} />
            View concert
          </Link>
        </div>
      )}
    />
  );
}
