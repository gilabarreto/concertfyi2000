import { Link } from "react-router-dom";
import { useContext } from "react";
import {
  dateLabel,
  getBestImage,
  getPastConcertsByArtist,
  getUpcomingConcertsByArtist,
  parseSetlistDate,
} from "../helpers/selectors";
import { AppContext } from "../context/AppContext";
import { SEOHead } from "../components/SEOHead";

import { useT } from "../i18n";
export default function SearchPage() {
  const t = useT();
  const { setlist = [], ticketmaster = {} } = useContext(AppContext);
  const { attractions = [] } = ticketmaster;

  const uniqueSetlist = Array.from(
    new Map(
      setlist
        .filter((item) => parseSetlistDate(item.eventDate) < new Date())
        .map((item) => [item.artist.mbid, item]),
    ).values(),
  );

  if (!uniqueSetlist.length) return null;

  return (
    <>
      <SEOHead
        title={t("Search Results - Artist Concerts & Setlists")}
        description="Browse concert setlists and event information for your favorite artists."
        url="/search"
      />
      <div className="w-full mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-4">{t("Search Results")}</h2>
        <hr className="border-t border-zinc-300 opacity-50 mb-6" />

        <div className="flex flex-wrap justify-center items-start gap-6">
          {uniqueSetlist.map((item) => {
            const artistId = item.artist.mbid;
            const concertId = getPastConcertsByArtist(setlist, artistId)[0]?.id ?? item.id;
            const artist = item.artist.name;
            const ticketmasterMap = attractions.find((a) => a.name === artist) || {};
            const rawImages = ticketmasterMap.images || [];
            const bestImageUrl = getBestImage(rawImages);
            const nextConcert = getUpcomingConcertsByArtist(ticketmaster.events, artist)[0];
            const venue = nextConcert?._embedded?.venues?.[0];
            const concertLocation = [venue?.city?.name, venue?.country?.countryCode]
              .filter(Boolean)
              .join(", ");

            return (
              <Link
                key={artistId + concertId}
                to={`/artists/${artistId}/concerts/${concertId}`}
                className="group block w-full sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] min-w-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600"
              >
                <div
                  className={`w-full aspect-video rounded-xl bg-zinc-100 bg-center bg-cover flex items-center justify-center p-4 text-sm text-zinc-500 transition-opacity group-hover:opacity-80 ${bestImageUrl ? "" : "border border-zinc-200"}`}
                  style={bestImageUrl ? { backgroundImage: `url(${bestImageUrl})` } : undefined}
                >
                  {!bestImageUrl && t("No photo available.")}
                </div>
                <div className="mt-3 flex min-w-0 flex-col items-center gap-1 text-center">
                  <h3 className="text-[1.2rem] font-bold break-words group-hover:text-red-800">
                    {artist}
                  </h3>
                  {nextConcert && (
                    <p className="text-[0.8rem] font-normal text-zinc-500 text-pretty">
                      {t("Next Concert")}: {dateLabel(nextConcert.dateObj)}
                      {concertLocation && ` · ${concertLocation}`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
