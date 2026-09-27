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
    <section aria-label="Top tracks" className="space-y-3">
      <CardTitle>Top tracks</CardTitle>
      <iframe
        className="w-full h-[800px] rounded-2xl"
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
