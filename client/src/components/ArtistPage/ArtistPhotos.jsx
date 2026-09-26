import { useState } from "react";
import { useArtistImages } from "../../api/queries";
import { getBestImage } from "../../helpers/selectors";

export default function ArtistPhotos({ artistId, artist, ticketmaster }) {
  const { data, isLoading, isError, refetch } = useArtistImages(artistId);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [failed, setFailed] = useState([]);
  const attraction =
    ticketmaster.attractions?.find((item) => item.name === artist) || ticketmaster.attractions?.[0];
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
        <div className="flex flex-wrap justify-center gap-2" aria-label="Choose artist photo">
          {visible.map((image, index) => (
            <button
              key={image.imageUrl}
              type="button"
              aria-label={`Show ${artist} photo ${index + 1}: ${image.label}`}
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
