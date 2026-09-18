import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
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
      linkOf={(concert) => `/artists/${props.artistId}/concerts/${concert.id}`}
      icon={faRotateLeft}
      iconTitle="Go to concert"
    />
  );
}
