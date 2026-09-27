import { useState } from "react";
import CardTitle from "./CardTitle";

// Spotify's own embed is an iframe; the wrapper packages that used to be here added a
// dependency for the same markup. The artist link only needs "/embed" spliced into it.
export default function Player({ attraction }) {
  const spotify = attraction?.externalLinks?.spotify?.[0]?.url;
  const [expanded, setExpanded] = useState(false);

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
        // O embed é iframe de outra origem: não dá pra mexer na lista, só na altura.
        // Medido no mobile: 470px mostra as 5 primeiras, 730px as 10 que o Spotify manda.
        className={`w-full rounded-2xl ${expanded ? "h-[730px]" : "h-[470px]"}`}
        src={spotify.replace("open.spotify.com/", "open.spotify.com/embed/")}
        title="Artist on Spotify"
        // O card do mapa começa a 592 px num viewport de 823 px — por isso adiar *ele*
        // piorou a medição. Este vem depois do mapa e da setlist inteira, sempre fora da
        // primeira dobra, então aqui o adiamento tira concorrência de rede de quem está na tela.
        loading="lazy"
        allow="encrypted-media; clipboard-write"
      />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="text-base text-red-600 hover:text-red-800 font-semibold"
        >
          {expanded ? "View Less" : "View More"}
        </button>
      </div>
    </section>
  );
}
