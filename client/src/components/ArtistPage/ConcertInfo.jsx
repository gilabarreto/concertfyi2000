import { useNavigate, useParams } from "react-router-dom";
import Icon from "../Icon";
import { faBackward, faForward, faPlus } from "@fortawesome/free-solid-svg-icons";
import { getPastConcertsByArtist, parseSetlistDate } from "../../helpers/selectors";
import Map from "./Map";

// Mesmo card que ArtistInfo.jsx, mesmos campos — só a caixa de mídia muda: mapa do show
// em vez de foto do artista. Duplicado de propósito, não extraído: ArtistInfo vai divergir
// nos campos que mostra, e um componente genérico pra dois conteúdos que estão prestes a
// ser diferentes é abstração para o problema errado.
export default function ConcertInfo(props) {
  const { concert, setlist } = props;
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();

  const pastConcerts = getPastConcertsByArtist(setlist, artistId);

  const idx = pastConcerts.findIndex((c) => String(c.id) === String(concertId));
  const lastConcertId = pastConcerts[idx + 1]?.id;
  const nextConcertId = pastConcerts[idx - 1]?.id;

  const concertDate = () => {
    return parseSetlistDate(concert.eventDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tour = concert.tour?.name || "No tour name";
  const venue = concert.venue?.name;
  const city = concert.venue.city?.name;
  const country = concert.venue.city?.country.code;

  return (
    <div className="flex-1 flex flex-col items-center sm:flex-row justify-between space-y-6 sm:space-y-0 sm:space-x-6">
      <div className="flex-1 flex justify-center sm:justify-start w-full">
        <div className="w-full sm:max-w-[400px] aspect-video rounded-md bg-gray-100 overflow-hidden">
          <Map concert={concert} />
        </div>
      </div>

      <div className="flex-1 w-full sm:w-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Last Concert</h2>

          {/* Precisa de conta pra registrar presença — ainda não existe área do usuário,
              então o botão fica visível mas desativado até essa peça existir. */}
          <button
            type="button"
            disabled
            title="Coming soon — sign in required"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-gray-400 text-sm cursor-not-allowed"
          >
            <Icon icon={faPlus} className="text-xs" />I WAS THERE
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
            {concertDate()}&ensp;
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
            Location:&ensp;{city}, {country}
          </li>
        </ol>
      </div>
    </div>
  );
}
