import CardTitle from "./CardTitle";

// Spotify's own embed is an iframe; the wrapper packages that used to be here added a
// dependency for the same markup. The artist link only needs "/embed" spliced into it.
export default function Player({ attraction }) {
  const spotify = attraction?.externalLinks?.spotify?.[0]?.url;

  if (!spotify) {
    return (
      <section aria-label="Top tracks" className="space-y-3">
        <CardTitle>Top tracks</CardTitle>
        <p className="text-zinc-500 text-center">Spotify link not available for this artist.</p>
      </section>
    );
  }

  return (
    <section aria-label="Top tracks" className="space-y-3 lg:flex lg:flex-1 lg:flex-col">
      <CardTitle>Top tracks</CardTitle>
      <iframe
        // Iframe de outra origem: a altura é o único controle. 470px mostra as 5 primeiras.
        // No desktop estica até a altura do card do Setlists.
        className="w-full h-[470px] rounded-2xl lg:h-auto lg:min-h-[470px] lg:flex-1"
        src={spotify.replace("open.spotify.com/", "open.spotify.com/embed/")}
        title="Artist on Spotify"
        // O card do mapa começa a 592 px num viewport de 823 px — por isso adiar *ele*
        // piorou a medição. Este vem depois do mapa e da setlist inteira, sempre fora da
        // primeira dobra, então aqui o adiamento tira concorrência de rede de quem está na tela.
        loading="lazy"
        allow="encrypted-media; clipboard-write"
      />
    </section>
  );
}
