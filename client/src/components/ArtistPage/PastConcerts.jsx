import { faEye } from "@fortawesome/free-solid-svg-icons/faEye";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { getPastConcertsByArtist } from "../../helpers/selectors";
import ConcertList from "./ConcertList";

import { useT } from "../../i18n";
export default function PastConcerts(props) {
  const t = useT();
  return (
    <ConcertList
      title={t("Past Concerts")}
      empty={t("No past concerts available for this artist yet. Check back later.")}
      showSearch={false}
      items={getPastConcertsByArtist(props.setlist, props.artistId)}
      locationOf={(concert) =>
        `${concert.venue.city?.name || ""}, ${concert.venue.city?.country.code || ""}`
      }
      iconTitle={t("Show concert options")}
      expand={(concert) => (
        <div className="px-2 py-3 sm:px-4">
          <Link
            to={`/artists/${props.artistId}/concerts/${concert.id}`}
            state={{ scrollTo: "last-concert" }}
            className="w-full px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Icon icon={faEye} />
            {t("View concert")}
          </Link>
        </div>
      )}
    />
  );
}
