import { useState } from "react";
import { useArtistAlbums } from "../../api/queries";

// Tag de afiliado da Amazon Associates. Sem ela o link funciona igual, só não comissiona.
const AMAZON_TAG = "";

// Link de busca, não de produto: link direto para um ASIN precisa da Product Advertising
// API, que a Amazon só libera depois das primeiras vendas qualificadas. A busca já cai
// na página do disco e vale a comissão de qualquer compra na sessão.
const amazonSearchUrl = (artist, title) => {
  const url = new URL("https://www.amazon.com/s");
  url.searchParams.set("k", `${artist} ${title}`);
  url.searchParams.set("i", "popular");
  if (AMAZON_TAG) url.searchParams.set("tag", AMAZON_TAG);
  return url.href;
};

export default function Albums({ artistId, artist }) {
  const { data } = useArtistAlbums(artistId);
  // Capa que o Cover Art Archive não tem: some o disco, em vez de um quadrado quebrado.
  const [missing, setMissing] = useState([]);
  const albums = (data?.albums || []).filter((album) => !missing.includes(album.id));

  if (!albums.length) return null;

  return (
    <div className="space-y-2 pt-4">
      <ul className="grid grid-cols-3 gap-3">
        {albums.map((album) => (
          <li key={album.id}>
            <a
              href={amazonSearchUrl(artist, album.title)}
              target="_blank"
              rel="sponsored noopener noreferrer"
              title={`${album.title} (${album.year}) on Amazon`}
              className="group block space-y-1 text-center"
            >
              <img
                src={`https://coverartarchive.org/release-group/${album.id}/front-250`}
                alt={`${album.title} cover`}
                loading="lazy"
                onError={() => setMissing((ids) => [...ids, album.id])}
                className="aspect-square w-full rounded-md object-cover bg-zinc-100 transition-opacity group-hover:opacity-80"
              />
              <span className="block truncate text-xs text-zinc-700 group-hover:text-red-600">
                {album.title}
              </span>
              <span className="block text-[10px] text-zinc-500">{album.year}</span>
            </a>
          </li>
        ))}
      </ul>
      {/* Exigência do Operating Agreement da Amazon Associates: aviso visível junto aos links. */}
      <p className="text-center text-[10px] text-zinc-500">
        As an Amazon Associate, ConcertFYI earns from qualifying purchases.
      </p>
    </div>
  );
}
