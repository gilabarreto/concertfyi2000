import { Link } from "react-router-dom";
import { useContext } from "react";
import { getBestImage } from "../helpers/selectors";
import { AppContext } from "../context/AppContext";
import { SEOHead } from "../components/SEOHead";

export default function SearchPage() {
  const { setlist = [], ticketmaster = {} } = useContext(AppContext);
  const { attractions = [], events = [] } = ticketmaster;

  const uniqueSetlist = Array.from(
    new Map(
      setlist
        .filter((item) => {
          const [day, month, year] = item.eventDate.split("-");
          return new Date(`${year}-${month}-${day}`) < new Date();
        })
        .map((item) => [item.artist.mbid, item])
    ).values()
  );

  if (!uniqueSetlist.length) return null;

  return (
    <>
      <SEOHead
        title="Search Results - Artist Concerts & Setlists"
        description="Browse concert setlists and event information for your favorite artists."
        url="/search"
      />
      <div className="w-full mx-auto px-6 py-8">
      <h2 className="text-4xl font-bold mb-4">Search Results</h2>
      <hr className="border-t border-gray-300 opacity-50 mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
        {uniqueSetlist.map((item) => {
          const artistId = item.artist.mbid;
          const concertId = item.id;
          const artist = item.artist.name;
          const ticketmasterMap = attractions.find((a) => a.name === artist) || {};
          const rawImages = ticketmasterMap.images || [];
          const bestImageUrl = getBestImage(rawImages);

          return (
            <div
              key={artistId + concertId}
              className="relative w-full overflow-hidden"
            >
              <Link
                to={`/artists/${artistId}/concerts/${concertId}`}
                state={{ artistImage: rawImages }}
                className="group block relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer"
                style={bestImageUrl ? { background: `url(${bestImageUrl}) center/cover` } : {}}
              >
                <div
                  className={`
                    w-full py-8 absolute inset-0 bg-red-600 bg-opacity-0 flex items-center justify-center
                    hover:bg-opacity-80 group-focus-visible:bg-opacity-80 transition duration-300 aspect-video rounded-xl overflow-hidden
                    border-4 border-solid border-transparent hover:border-zinc-800 group-focus-visible:border-zinc-800 pointer-events-auto z-10
                    text-red-600 hover:text-zinc-100 group-focus-visible:text-zinc-100
                    ${bestImageUrl ? 'opacity-0 hover:opacity-100 group-focus-visible:opacity-100' : 'opacity-100'}
                  `}
                >
                  <span aria-hidden="true" className="text-8xl sm:text-[110px] text-zinc-800 font-medium pr-4 -z-20">
                    {"{"}
                  </span>

                  <div className="w-full flex flex-1 justify-center mb-2">
                    <h1 className="pb-2 text-center text-4xl lg:text-5xl font-bold">
                      {artist}
                    </h1>
                  </div>

                  <span aria-hidden="true" className="text-8xl sm:text-[110px] text-zinc-800 font-medium pl-4">
                    {"}"}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
}
