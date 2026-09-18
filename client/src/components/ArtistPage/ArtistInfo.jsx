import Icon from "../Icon";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { getBestImage, getTicketmasterGenres } from "../../helpers/selectors";
import { useArtistBackground } from "../../api/queries";
import { useParams } from "react-router-dom";

// O href vem do `externalLinks` da Ticketmaster, ou seja, de fora. O React 18 avisa no
// console de desenvolvimento quando o href é `javascript:`, mas renderiza assim mesmo —
// quem clicasse rodaria o script na origem do concertfyi.com. Um href indefinido vira
// texto inerte, que é a falha certa aqui.
const httpOnly = (url) => (/^https?:\/\//i.test(url) ? url : undefined);

const SOCIALS = [
  { key: "youtube", icon: faYoutube, label: "YouTube" },
  { key: "instagram", icon: faInstagram, label: "Instagram" },
  { key: "twitter", icon: faTwitter, label: "Twitter" },
];

export default function ArtistInfo(props) {
  const { concert, ticketmaster } = props;
  const { artistId } = useParams();

  const bestImageUrl = getBestImage(ticketmaster.attractions?.[0]?.images || []);
  const links = ticketmaster.attractions?.[0]?.externalLinks || {};

  // :artistId já é o mbid (é assim que o Setlist.fm casa com o mesmo artista), então
  // nenhuma busca por nome é necessária aqui — só o lookup direto no MusicBrainz.
  const { data: background = {}, isLoading: isBackgroundLoading } = useArtistBackground(artistId);
  const { origin, genres = [], currentMembers } = background;

  // A Ticketmaster já está em mãos (é prop, não fetch) e cobre o mesmo campo, mais pobre:
  // um gênero e um subgênero contra o top 4 por tag do MusicBrainz. Serve de placeholder até
  // o MusicBrainz responder; se ele não tiver gênero pra esse artista, o tampão fica valendo.
  const displayGenres = genres.length > 0 ? genres : getTicketmasterGenres(ticketmaster);

  const artist = concert.artist.name;

  return (
    <div className="flex-1 flex flex-col items-center sm:flex-row sm:items-start justify-between space-y-6 sm:space-y-0 sm:space-x-6">
      {/* `sm:items-start` no pai (a linha inteira) alinha as duas colunas pelo topo — a foto
          some no meio de um card mais alto quando o quadro fica centralizado. Dentro desta
          coluna, porém, `items-center` continua: a foto e os socials embaixo dela ficam
          centralizados entre si, não colados na borda esquerda. */}
      <div className="flex-1 flex flex-col items-center w-full">
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

        <span className="flex text-sm justify-center mt-4 space-x-4">
          {SOCIALS.map(({ key, icon, label }) =>
            links[key] ? (
              <a
                key={key}
                href={httpOnly(links[key][0].url)}
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

      <div className="flex-1 w-full sm:w-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{artist}</h2>
          <Icon icon={faHeart} className="text-2xl cursor-pointer text-gray-500" size="2x" />
        </div>

        <hr className="border-t border-gray-300 opacity-50 ml-6" />

        {/* Estilo infobox da Wikipedia ("Background information"), mas só os campos que o
            MusicBrainz modela como dado estruturado. Discografia e spinoffs ficam de fora —
            aquilo exigiria raspar a infobox em si, não uma API. Artista raro no MusicBrainz
            (ou ainda carregando) esconde a linha em vez de mostrar vazio. */}
        <ol className="pl-6">
          {/* isLoading (não isFetching) é só a primeira busca, sem cache ainda — troca de
              show do mesmo artista não reacende isto, já que o mbid não muda. */}
          {isBackgroundLoading && (
            <li className="border-b border-gray-300/50 py-2 text-gray-400">Loading artist info…</li>
          )}
          {origin && <li className="border-b border-gray-300/50 py-2">Origin:&ensp;{origin}</li>}
          {displayGenres.length > 0 && (
            <li className="border-b border-gray-300/50 py-2">
              Genres:&ensp;{displayGenres.join(", ")}
            </li>
          )}
          {currentMembers?.length > 0 && (
            <li className="border-b border-gray-300/50 py-2">
              Members:&ensp;{currentMembers.join(", ")}
            </li>
          )}
        </ol>

        {/* Página própria do artista ainda não existe — quando existir, isto vira
            <Link to={`/artists/${artistId}`}>. Por ora fica visível e inerte, como o
            "I WAS THERE" do ConcertInfo. */}
        <button
          type="button"
          disabled
          title="Coming soon"
          className="block mx-auto mt-2 text-sm font-semibold text-gray-400 cursor-not-allowed"
        >
          Learn More
        </button>
      </div>
    </div>
  );
}
