import { useEffect, useRef, useState } from "react";
import { useArtistImages } from "../../api/queries";
import { getBestImage } from "../../helpers/selectors";

export default function ArtistPhotos({ artistId, artist, attraction }) {
  const { data, isLoading, isError, refetch } = useArtistImages(artistId);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [failed, setFailed] = useState([]);
  const stripRef = useRef(null);
  const [stripWidth, setStripWidth] = useState(0);
  const mainImage = getBestImage(attraction?.images || []);
  const images = mainImage
    ? [
        {
          imageUrl: mainImage,
          label: "Artist photo",
          source: "Ticketmaster",
          sourceUrl: attraction.url,
        },
      ]
    : [];
  for (const image of data?.images || []) {
    if (!images.some((item) => item.imageUrl === image.imageUrl)) {
      images.push({ ...image, source: "TheAudioDB", sourceUrl: data.sourceUrl });
    }
  }
  const visible = images.filter((image) => !failed.includes(image.imageUrl));
  const selected = visible.find((image) => image.imageUrl === selectedUrl) || visible[0];
  const failImage = (url) => setFailed((previous) => [...previous, url]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const observer = new ResizeObserver(() => setStripWidth(strip.clientWidth));
    observer.observe(strip);
    return () => observer.disconnect();
  }, [visible.length]);
  // Chaves de 24 px + gap de 8 px de cada lado; cada miniatura ocupa 56 + 8 px.
  const pageSize = Math.max(1, Math.floor((stripWidth - 64 + 8) / 64));
  // Como o Swiper: as chaves andam uma foto por vez e param nas pontas; a página de
  // miniaturas segue a foto selecionada.
  const selectedIndex = Math.max(0, visible.indexOf(selected));
  const step = (delta) => setSelectedUrl(visible[selectedIndex + delta].imageUrl);
  const currentPage = Math.floor(selectedIndex / pageSize);
  const shownPhotos = visible.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="w-full sm:max-w-[520px] space-y-2" aria-label="Artist photos">
      <div className="aspect-video overflow-hidden rounded-md bg-zinc-200 flex items-center justify-center">
        {selected ? (
          <img
            src={selected.imageUrl}
            alt={`${artist} — ${selected.label}`}
            className="h-full w-full object-cover"
            onError={() => failImage(selected.imageUrl)}
          />
        ) : (
          <p className="px-4 text-center text-sm text-zinc-500">
            {isLoading ? "Loading artist photos…" : "No artist photos available."}
          </p>
        )}
      </div>
      {visible.length > 1 && (
        <div
          ref={stripRef}
          className="flex w-full min-w-0 items-center gap-2"
          aria-label="Choose artist photo"
        >
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={selectedIndex === 0}
            aria-label="Previous artist photo"
            className="flex h-14 w-6 shrink-0 items-center justify-center text-[3.5rem] font-light leading-none text-red-600 disabled:text-zinc-300"
          >
            {"{"}
          </button>
          <div className="flex min-w-0 flex-1 justify-center gap-2">
            {shownPhotos.map((image, index) => (
              <button
                key={image.imageUrl}
                type="button"
                aria-label={`Show ${artist} photo ${currentPage * pageSize + index + 1}: ${image.label}`}
                aria-pressed={selected?.imageUrl === image.imageUrl}
                onClick={() => setSelectedUrl(image.imageUrl)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${selected?.imageUrl === image.imageUrl ? "border-red-600" : "border-transparent hover:border-zinc-400"}`}
              >
                <img
                  src={image.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={() => failImage(image.imageUrl)}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={selectedIndex === visible.length - 1}
            aria-label="Next artist photo"
            className="flex h-14 w-6 shrink-0 items-center justify-center text-[3.5rem] font-light leading-none text-red-600 disabled:text-zinc-300"
          >
            {"}"}
          </button>
        </div>
      )}
      {selected && (
        <p className="text-center text-xs text-zinc-500">
          Source:{" "}
          <a
            href={/^https?:\/\//i.test(selected.sourceUrl) ? selected.sourceUrl : selected.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-red-600"
          >
            {selected.source}
          </a>
        </p>
      )}
      {isError && (
        <p className="text-center text-xs text-zinc-500">
          Source: Could not load additional photos.{" "}
          <button type="button" onClick={() => refetch()} className="text-red-600 underline">
            Try again
          </button>
        </p>
      )}
    </div>
  );
}
