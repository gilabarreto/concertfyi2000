import logo from "../icons/logo-small.png";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTicketmasterSuggest, addFavourite } from "../api/api";
import { getBestImage } from "../helpers/selectors";

export default function SearchPage({
  setlist = [],
  ticketmaster = {},
  favourites = [],
  setFavourites,
}) {
  const navigate = useNavigate();
  const { attractions = [], events = [] } = ticketmaster;

  const handleFavourite = async (artistId, artist, artistImage) => {
    try {
      let imageToUse = artistImage;
      if (!artistImage?.startsWith("http")) {
        const res = await getTicketmasterSuggest(artist);
        imageToUse =
          res.data._embedded?.attractions?.[0]?.images?.[0]?.url || logo;
      }
      const response = await addFavourite(artistId, artist, imageToUse);
      const { artist_id } = response.data.favourite;
      setFavourites((prev) => [
        ...prev,
        {
          artist_id,
          artistimage: imageToUse,
          artistid: artistId,
          artistname: artist,
        },
      ]);
    } catch (err) {
      console.error("Erro ao adicionar favorito:", err);
      alert("Erro ao adicionar favorito");
    }
  };


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
          const bestImageUrl = getBestImage(rawImages) || logo;
          const spotifyLink = ticketmasterMap.externalLinks?.spotify?.[0]?.url;
          const isFavourite = favourites.some(
            (fav) => fav.artistid === artistId
          );

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
              key={artistId}
              className="
    relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden
    border-4 border-solid
    transition-all duration-300
   border-zinc-800
    cursor-pointer
  "
              style={{ background: `url(${bestImageUrl}) center/cover` }}
              onClick={handleNavigate}
            >
              <div className="absolute inset-0 bg-red-600 bg-opacity-0 flex flex-col justify-between p-6 hover:bg-opacity-80 transition duration-300">

                <div className="flex justify-between items-center">
                  <h1 className="text-4xl font-bold text-white lg:text-4xl">
                    {artist}
                  </h1>
                  <FontAwesomeIcon
                    icon="heart"
                    size="2x"
                    className={`favourite-icon${isFavourite ? " active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavourite(artistId, artist, bestImageUrl);
                    }}
                  />
                </div>
                <div>
                  <div className="text-2xl text-gray-300 mt-2 ml-4">
                    Next concert
                  </div>
                  <div className="text-xl text-white ml-4">
                    {localDate ? nextConcertDate(localDate) : "Unavailable"}
                  </div>
                  <div className="text-2xl text-gray-300 mt-2 ml-4">
                    Last concert
                  </div>
                  <div className="text-xl text-white ml-4">
                    {lastConcertDate(item.eventDate) || "Unavailable"}
                  </div>
                </div>
                <div className="flex justify-end">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
