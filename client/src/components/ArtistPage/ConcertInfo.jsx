import { useNavigate, useParams } from "react-router-dom";
import Icon from "../Icon";
import { faBackward, faForward, faHeart } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { getBestImage, getLastConcertsByArtist, parseSetlistDate } from "../../helpers/selectors";

const SOCIALS = [
  { key: "youtube", icon: faYoutube, label: "YouTube" },
  { key: "instagram", icon: faInstagram, label: "Instagram" },
  { key: "twitter", icon: faTwitter, label: "Twitter" },
];

export default function ConcertInfo(props) {
  const { concert, setlist, ticketmaster } = props;
  const navigate = useNavigate();
  const { artistId, concertId } = useParams();

  const bestImageUrl = getBestImage(ticketmaster.attractions?.[0]?.images || []);
  const links = ticketmaster.attractions?.[0]?.externalLinks || {};

  const lastConcerts = getLastConcertsByArtist(setlist, artistId);

  const idx = lastConcerts.findIndex((c) => String(c.id) === String(concertId));
  const lastConcertId = lastConcerts[idx + 1]?.id;
  const nextConcertId = lastConcerts[idx - 1]?.id;

  const concertDate = () => {
    return parseSetlistDate(concert.eventDate).toLocaleDateString("en-US", {
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
      {/* `w-full` aqui porque o pai é `items-center`: sem largura definida, o `w-full` da
          caixa de baixo resolvia para zero e ela não reservava altura nenhuma. */}
      <div className="flex-1 flex justify-center sm:justify-start w-full">
        {/* A foto não vem com o show: vem da segunda chamada, a da Ticketmaster. Sem esta
            caixa reservada o card nascia sem foto e crescia ~210px quando ela chegava,
            empurrando mapa, setlist e tudo abaixo — 0,17 de CLS, o pior número da página.
            16:9 é o formato que o getBestImage prefere e o que os cards da busca usam;
            quem não tem foto na Ticketmaster fica com a caixa vazia em vez do pulo. */}
        <div className="w-full sm:max-w-[400px] aspect-video rounded-md bg-gray-100">
          {bestImageUrl && (
            <img
              src={bestImageUrl}
              alt={`${artist} portrait`}
              className="object-cover w-full h-full rounded-md"
            />
          )}
        </div>
      </div>

      <div className="flex-1 w-full sm:w-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{artist}</h2>
          <Icon icon={faHeart} className="text-2xl cursor-pointer text-gray-500" size="2x" />
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

        <span className="flex text-sm justify-center mt-4 space-x-4">
          {SOCIALS.map(({ key, icon, label }) =>
            links[key] ? (
              <a
                key={key}
                href={links[key][0].url}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
              >
                <Icon icon={icon} className="text-gray-500" size="2x" />
              </a>
            ) : null,
          )}
        </span>
      </div>
    </div>
  );
}
