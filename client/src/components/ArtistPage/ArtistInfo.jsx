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
  const hasSocials = SOCIALS.some(({ key }) => links[key]);
  const socialIcons = SOCIALS.map(({ key, icon, label }) =>
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
  );

  // :artistId já é o mbid (é assim que o Setlist.fm casa com o mesmo artista), então
  // nenhuma busca por nome é necessária aqui — só o lookup direto no MusicBrainz.
  const {
    data: background = {},
    isLoading: isBackgroundLoading,
    isError: isBackgroundError,
    refetch: refetchBackground,
  } = useArtistBackground(artistId);
  const { origin, genres = [], currentMembers } = background;

  // A Ticketmaster já está em mãos (é prop, não fetch) e cobre o mesmo campo, mais pobre: um
  // gênero e um subgênero contra o top 4 por tag do MusicBrainz. Só entra depois que o
  // MusicBrainz responder com sucesso e não tiver gênero pra esse artista — carregando ou
  // com erro, o tampão fica de fora: um erro de rede virando silenciosamente "o gênero é
  // esse aqui da Ticketmaster" escondia a falha em vez de avisar.
  const displayGenres =
    isBackgroundLoading || isBackgroundError
      ? []
      : genres.length > 0
        ? genres
        : getTicketmasterGenres(ticketmaster);

  const artist = concert.artist.name;

  return (
    <div className="flex-1 flex flex-col items-center sm:flex-row justify-between gap-6">
      {/* `gap-6`, not `space-y-6`/`space-x-6`: those add margin to the DOM-second child only,
          and `sm:order-*` below changes visual position without moving the DOM — the margin
          stayed glued to the info column even after it became the visually-first one, so it
          opened a gap on the wrong side. `gap` tracks visual order, so it always lands
          between the two, whichever is on the right. */}
      {/* `items-center` no pai (a linha inteira) centraliza esta coluna na vertical contra a
          de texto, que costuma ser mais alta. Dentro dela, `items-center` de novo: a foto e
          o nome/coração embaixo ficam no mesmo eixo central, não colados na borda esquerda. */}
      {/* `sm:flex-[1.1]` contra `sm:flex-[0.9]` da coluna de texto: os dois somam 2, igual
          ao antigo flex-1/flex-1 (50/50) — então 1.1/2 = 55% é exatamente +10% sobre aquela
          metade. Era `flex-[2]`/`flex-1` (2:1, ~66%), reduzido a pedido. O `max-w-[520px]` da
          caixa abaixo nunca é alcançado nessa proporção — ver o commit que explica por quê.
          `sm:order-2`: no desktop a foto passa pra direita da info, sem mover o DOM — no
          mobile (flex-col, sem classe de order) ela continua acima, como antes. */}
      <div className="flex-1 sm:flex-[1.1] sm:order-2 flex flex-col items-center w-full">
        {/* A foto não vem com o show: vem da segunda chamada, a da Ticketmaster. Sem esta
            caixa reservada o card nascia sem foto e crescia ~210px quando ela chegava,
            empurrando mapa, setlist e tudo abaixo — 0,17 de CLS, o pior número da página.
            16:9 é o formato que o getBestImage prefere e o que os cards da busca usam;
            quem não tem foto na Ticketmaster fica com a caixa vazia em vez do pulo. */}
        <div className="w-full sm:max-w-[520px] aspect-video rounded-md bg-gray-100">
          {bestImageUrl && (
            <img
              src={bestImageUrl}
              alt={`${artist} portrait`}
              className="object-cover w-full h-full rounded-md"
            />
          )}
        </div>

        <div className="w-full sm:max-w-[520px] flex justify-between items-center mt-4">
          <h2 className="text-3xl font-bold text-balance">{artist}</h2>
          {/* Favoritar ainda não existe (sem área do usuário) — mesmo tratamento do "I WAS
              THERE"/"Learn More": visível, mas `disabled` de verdade em vez de um ícone solto
              com `cursor-pointer` fingindo ser clicável sem receber foco nem ter aria-label.
              Sem `text-2xl` aqui de propósito: o `size="2x"` do Icon é `2em` relativo ao
              font-size herdado — um `text-2xl` no botão dobra essa conta (2em de 1.5rem, não
              de 1rem) e o ícone sai maior que o dos socials, que não tem essa classe. */}
          <button
            type="button"
            disabled
            title="Coming soon"
            aria-label="Favorite this artist"
            className="text-gray-500 cursor-not-allowed"
          >
            <Icon icon={faHeart} size="2x" />
          </button>
        </div>
      </div>

      <div className="flex-1 sm:flex-[0.9] sm:order-1 w-full sm:w-auto">
        <h2 className="text-3xl font-bold text-balance mb-4">Artist Info</h2>

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
          {isBackgroundError && (
            <li className="border-b border-gray-300/50 py-2 text-gray-400">
              Something went wrong.{" "}
              <button
                type="button"
                onClick={() => refetchBackground()}
                className="font-semibold text-red-600 hover:text-red-800"
              >
                Try again
              </button>
            </li>
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
          {/* Mesma borda que separa cada linha desta lista serve de divisor entre o socials
              e o Learn More logo abaixo, sem precisar de outro elemento só pra isso. */}
          {hasSocials && (
            <li className="border-b border-gray-300/50 py-2">
              Socials:&ensp;
              <span className="inline-flex items-center gap-4 align-middle">{socialIcons}</span>
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
