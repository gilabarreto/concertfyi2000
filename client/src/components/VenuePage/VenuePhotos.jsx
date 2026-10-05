import { useEffect, useState } from "react";
import { useVenuePhotos } from "../../api/queries";
import CardTitle from "../ArtistPage/CardTitle";
import VenueSource from "./VenueSource";
import Icon from "../Icon";
import { faCamera } from "@fortawesome/free-solid-svg-icons/faCamera";

const safeUrl = (value) => (/^https?:\/\//i.test(value || "") ? value : undefined);

export default function VenuePhotos({ identity, enabled, name }) {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [page, setPage] = useState(0);
  const [failed, setFailed] = useState([]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setDesktop(media.matches);
      setPage(0);
      setFailed([]);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const limit = desktop ? 6 : 3;
  const { data, isLoading, isError, refetch } = useVenuePhotos(
    identity,
    enabled,
    page * limit,
    limit,
  );
  const total = data?.total || 0;
  const photos = (data?.photos || []).filter((photo) => !failed.includes(photo.imageUrl));
  return (
    <section aria-label="Venue photos" className="bg-white px-4 space-y-2">
      <CardTitle>Photos</CardTitle>
      <div className="min-h-36 lg:min-h-52">
        {isLoading ? (
          <p role="status" className="text-center text-zinc-500 py-4">
            Loading venue photos…
          </p>
        ) : isError || data?.status === "unavailable" ? (
          <p className="text-center text-zinc-500 py-4">
            Photos are temporarily unavailable.{" "}
            <button type="button" onClick={() => refetch()} className="text-red-600">
              Try again
            </button>
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4" aria-roledescription="carousel">
              <button
                type="button"
                aria-label="Previous venue photos"
                disabled={page === 0}
                onClick={() => {
                  setPage(page - 1);
                  setFailed([]);
                }}
                className="flex w-6 shrink-0 items-center justify-center text-[5.25rem] font-light leading-none text-red-600 disabled:text-zinc-300"
              >
                {"{"}
              </button>
              <ul className="flex min-w-0 flex-1 justify-center gap-3">
                {photos.map((photo, index) => (
                  <li
                    key={photo.imageUrl}
                    className="w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-3.75rem)/6)]"
                  >
                    <a
                      href={safeUrl(data.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                      title={`View ${name} on Google Maps`}
                    >
                      <img
                        src={safeUrl(photo.imageUrl)}
                        alt={`${name} — venue photo ${page * limit + index + 1}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-md object-cover bg-zinc-100 transition-opacity hover:opacity-80"
                        onError={() => setFailed((previous) => [...previous, photo.imageUrl])}
                      />
                    </a>
                  </li>
                ))}
                {!photos.length && (
                  <li className="py-4 text-center text-zinc-500">No venue photos available.</li>
                )}
              </ul>
              <button
                type="button"
                aria-label="Next venue photos"
                disabled={(page + 1) * limit >= total}
                onClick={() => {
                  setPage(page + 1);
                  setFailed([]);
                }}
                className="flex w-6 shrink-0 items-center justify-center text-[5.25rem] font-light leading-none text-red-600 disabled:text-zinc-300"
              >
                {"}"}
              </button>
            </div>
            {photos.some((photo) => photo.authors?.length) && (
              <ul className="mt-1 flex justify-center gap-3 px-10">
                {photos.map((photo) => (
                  <li
                    key={photo.imageUrl}
                    className="w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-3.75rem)/6)]"
                  >
                    {photo.authors?.map((author, authorIndex) => (
                      <p
                        key={authorIndex}
                        className="text-center text-xs text-zinc-500 break-words"
                      >
                        <a
                          href={safeUrl(author.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-red-600"
                        >
                          <Icon icon={faCamera} className="mr-1" />
                          {author.name}
                        </a>
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
            {data?.source && <VenueSource detail={data} />}
            {data?.partial && (
              <p className="text-center text-xs text-zinc-500">
                Some photos are temporarily unavailable.{" "}
                <button type="button" onClick={() => refetch()} className="text-red-600">
                  Try again
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
