import { useState } from "react";
import { useArtistAlbums } from "../../api/queries";
import CardTitle from "./CardTitle";

import { useT } from "../../i18n";
// Tag de afiliado da Amazon Associates Canadá (só vale na amazon.ca). Sem ela o link funciona igual, só não comissiona.
const AMAZON_TAG = "";

// Link de busca, não de produto: link direto para um ASIN precisa da Product Advertising
// API, que a Amazon só libera depois das primeiras vendas qualificadas. A busca já cai
// na página do disco e vale a comissão de qualquer compra na sessão.
const amazonSearchUrl = (artist, title) => {
  const url = new URL("https://www.amazon.ca/s");
  url.searchParams.set("k", `${artist} ${title}`);
  url.searchParams.set("i", "popular");
  if (AMAZON_TAG) url.searchParams.set("tag", AMAZON_TAG);
  return url.href;
};

export default function Albums({ artistId, artist, className = "" }) {
  const t = useT();
  const { data } = useArtistAlbums(artistId);
  // Capa que o Cover Art Archive não tem: some o disco, em vez de um quadrado quebrado.
  const [missing, setMissing] = useState([]);
  const albums = (data?.albums || []).filter((album) => !missing.includes(album.id));

  if (!albums.length) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <CardTitle>{t("Keep Listening")}</CardTitle>
      {/* Exigência do Operating Agreement da Amazon Associates: aviso visível junto aos links. */}
      <p className="text-center text-sm text-zinc-500">
        {t("As an Amazon Associate, ConcertFYI earns from qualifying purchases.")}
      </p>
      {/* Flex em vez de grid: fileira incompleta (artista com 4 ou 5 discos) fica no centro. */}
      <ul className="flex flex-wrap justify-center gap-3">
        {albums.map((album) => (
          <li key={album.id} className="w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-3.75rem)/6)]">
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
              <span className="line-clamp-2 text-balance text-sm group-hover:text-red-800">
                {album.title}
              </span>
              <span className="block text-sm font-semibold group-hover:text-red-800">
                {album.year}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
