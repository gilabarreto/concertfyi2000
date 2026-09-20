import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../Icon";
import { faBackward, faForward, faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { getPastConcertsByArtist, parseSetlistDate, dateLabel } from "../../helpers/selectors";
import Map from "./Map";

const ATTENDED_KEY = "attendedConcertIds";

function getAttended() {
  return JSON.parse(localStorage.getItem(ATTENDED_KEY) || "[]");
}

// Mesmo card que ArtistInfo.jsx, mesmos campos — só a caixa de mídia muda: mapa do show
// em vez de foto do artista. Duplicado de propósito, não extraído: ArtistInfo vai divergir
// nos campos que mostra, e um componente genérico pra dois conteúdos que estão prestes a
// ser diferentes é abstração para o problema errado.
export default function ConcertInfo(props) {
  const { concert, setlist } = props;
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();
  const [attended, setAttended] = useState(getAttended);

  const wasThere = attended.includes(concert.id);
  const toggleWasThere = () => {
    const next = wasThere ? attended.filter((id) => id !== concert.id) : [...attended, concert.id];
    setAttended(next);
    localStorage.setItem(ATTENDED_KEY, JSON.stringify(next));
  };

  const pastConcerts = getPastConcertsByArtist(setlist, artistId);

  const idx = pastConcerts.findIndex((c) => String(c.id) === String(concertId));
  const lastConcertId = pastConcerts[idx + 1]?.id;
  const nextConcertId = pastConcerts[idx - 1]?.id;

  const tour = concert.tour?.name || "No tour name";
  const venue = concert.venue?.name;
  const city = concert.venue.city?.name;
  const country = concert.venue.city?.country.code;

  return (
    <div className="flex-1 flex flex-col lg:flex-row items-center gap-6">
      <div className="w-full lg:flex-1 lg:min-w-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-3xl font-bold text-balance">Last Concert</h2>
          {/* Marca localmente que o usuário esteve neste show — sem conta de usuário ainda,
              guardado por navegador em vez de por pessoa. */}
          <button
            type="button"
            onClick={toggleWasThere}
            aria-pressed={wasThere}
            title={wasThere ? "Remove from concerts you attended" : "Mark that you were there"}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
              wasThere
                ? "border-red-600 text-red-600 hover:bg-red-50"
                : "border-gray-300 text-gray-500 hover:border-red-600 hover:text-red-600"
            }`}
          >
            <Icon icon={wasThere ? faCheck : faPlus} className="text-[0.65rem]" />I WAS THERE
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
            {dateLabel(parseSetlistDate(concert.eventDate))}&ensp;
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

      <div className="flex justify-center w-full lg:flex-1 lg:min-w-0">
        <div className="w-full sm:max-w-[520px] aspect-video rounded-md bg-gray-100 overflow-hidden">
          <Map concert={concert} />
        </div>
      </div>
    </div>
  );
}
