import CardTitle from "./CardTitle";
import CardNotice from "./CardNotice";
import { useArtistSpotify } from "../../api/queries";

import { useT } from "../../i18n";
// Spotify's own embed is an iframe; the wrapper packages that used to be here added a
// dependency for the same markup. The artist link only needs "/embed" spliced into it.
// Sem link na Ticketmaster, tenta o do MusicBrainz pelo mbid (só a página de show tem um).
export default function Player({ attraction, mbid }) {
  const t = useT();
  const ticketmaster = attraction?.externalLinks?.spotify?.[0]?.url;
  const { data } = useArtistSpotify(mbid, !ticketmaster);
  const spotify = ticketmaster || data?.spotify;

  if (!spotify) {
    return (
      <section aria-label={t("Top tracks")} className="space-y-3 lg:flex lg:flex-1 lg:flex-col">
        <CardTitle>{t("Top tracks")}</CardTitle>
        <CardNotice>{t("No Spotify link available.")}</CardNotice>
      </section>
    );
  }

  return (
    <section aria-label={t("Top tracks")} className="space-y-3 lg:flex lg:flex-1 lg:flex-col">
      <CardTitle>{t("Top tracks")}</CardTitle>
      <iframe
        // Iframe de outra origem: a altura é o único controle. 470px mostra as 5 primeiras.
        // No desktop estica até a altura do card do Setlists.
        className="w-full h-[470px] rounded-2xl lg:h-auto lg:min-h-[470px] lg:flex-1"
        src={spotify.replace("open.spotify.com/", "open.spotify.com/embed/")}
        title={t("Artist on Spotify")}
        // O card do mapa começa a 592 px num viewport de 823 px — por isso adiar *ele*
        // piorou a medição. Este vem depois do mapa e da setlist inteira, sempre fora da
        // primeira dobra, então aqui o adiamento tira concorrência de rede de quem está na tela.
        loading="lazy"
        allow="encrypted-media; clipboard-write"
      />
    </section>
  );
}
