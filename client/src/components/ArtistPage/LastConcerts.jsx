import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { getLastConcertsByArtist } from "../../helpers/selectors";
import ConcertList from "./ConcertList";

export default function LastConcerts(props) {
  return (
    <ConcertList
      title="Last Concerts"
      empty="No recent concerts. Check back later."
      items={getLastConcertsByArtist(props.setlist, props.artistId)}
      locationOf={(concert) =>
        `${concert.venue.city?.name || ""}, ${concert.venue.city?.country.code || ""}`
      }
      linkOf={(concert) => `/artists/${props.artistId}/concerts/${concert.id}`}
      icon={faRotateLeft}
      iconTitle="Go to concert"
    />
  );
}
