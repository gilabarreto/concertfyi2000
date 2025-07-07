import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getBestImage } from "../helpers/selectors";

export default function SearchPage({
  setlist = [],
  ticketmaster = {},
}) {

  const navigate = useNavigate();
  const { attractions = [], events = [] } = ticketmaster;

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const nextConcertDate = (localDate) =>
    localDate ? formatDate(new Date(localDate)) : null;
  const lastConcertDate = (eventDate) => {
    if (!eventDate) return null;
    const [day, month, year] = eventDate.split("-");
    const date = new Date(`${year}-${month}-${day}`);
    return date <= new Date() ? formatDate(date) : null;
  };

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
    <div className="w-full mx-auto px-6 py-8">
      <h2 className="text-4xl font-bold mb-4">Search Results</h2>
      <hr className="border-t border-gray-300 opacity-50 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
        {uniqueSetlist.map((item) => {
          const artistId = item.artist.mbid;
          const concertId = item.id;
          const artist = item.artist.name;
          const ticketmasterMap =
            attractions.find((a) => a.name === artist) || {};
          const rawImages = ticketmasterMap.images || [];
          const bestImageUrl = getBestImage(rawImages);
          const spotifyLink = ticketmasterMap.externalLinks?.spotify?.[0]?.url;
          const artistEvents = events
            .filter((e) =>
              e._embedded?.attractions?.some((a) => a.name === artist)
            )
            .sort((a, b) =>
              a.dates.start.localDate.localeCompare(b.dates.start.localDate)
            );
          const localDate = artistEvents[0]?.dates?.start?.localDate;
          const handleNavigate = () =>
            navigate(`/artists/${artistId}/concerts/${concertId}`, {
              state: { artistImage: rawImages },
            });

          return (
            <div
              key={artistId + concertId}  // usando um valor mais único ainda
              className="relative w-full overflow-hidden"
            >

              <div
                className="relative w-full aspect-video rounded-xl overflow-hidden"
                style={bestImageUrl ? { background: `url(${bestImageUrl}) center/cover` } : {}}  // ← Modificado (condicional)
              >
                <div className="py-8 absolute inset-0 bg-red-600 bg-opacity-0 flex justify-between items-center hover:bg-opacity-80 transition duration-300 aspect-video rounded-xl overflow-hidden border-4 border-solid border-transparent hover:border-zinc-800 group-hover:bg-opacity-80 pointer-events-auto z-20 text-red-600  hover:text-zinc-100">
                  <span className="text-8xl sm:text-[110px] text-zinc-800  font-medium pr-4">
                    {"{"}
                  </span>

                  <div className="w-full flex flex-col justify-between ">
                    <div className="flex flex-1 justify-between mb-2 ">
                      <h1 className="pb-2 text-2xl lg:text-3xl font-bold hover:text-zinc-800
          hover:underline hover:underline-offset-8
          hover:opacity-90
          transition-all duration-900 ease-in cursor-pointer" onClick={handleNavigate}>
                        {artist}
                      </h1>
                    </div>
                    <div className="flex flex-col justify-between mb-2">
                      <span className="text-xl lg:text-3xl font-semibold">
                        Next concert
                      </span>
                      <span className="text-xl lg:text-2xl">
                        {localDate ? nextConcertDate(localDate) : "Unavailable"}
                      </span>
                      <span span className="text-xl lg:text-3xl font-semibold pt-2">
                        Last concert
                      </span>
                      <span className="text-xl lg:text-2xl">
                        {lastConcertDate(item.eventDate) || "Unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-around h-full">
                    <FontAwesomeIcon
                      icon="heart"
                      size="2x"
                      className="cursor-pointer"
                    />
                    {spotifyLink ? (
                      <a
                        href={spotifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FontAwesomeIcon
                          icon={["fab", "spotify"]}
                          size="3x"
                          className="spotify-true"
                        />
                      </a>
                    ) : (
                      <FontAwesomeIcon icon={["fab", "spotify"]} size="3x" />
                    )}
                  </div>
                  <div>
                    <span className="text-8xl sm:text-[110px] text-zinc-800  font-medium pl-4">
                      {"}"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div >
  );
}
