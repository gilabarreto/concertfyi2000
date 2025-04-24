import logo from "../icons/logo-small.png";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTicketmasterSuggest, addFavourite } from "../api/api";

export default function SearchPage(props) {
  const navigate = useNavigate();
  const {
    setlist = [],
    ticketmaster = {},
    favourites = [],
    setFavourites,
  } = props;
  const attractions = ticketmaster.attractions || [];
  const events = ticketmaster.events || [];

  const handleFavourite = async (artistId, artist, artistImage) => {
    try {
      let imageToUse = artistImage;

      if (!artistImage.startsWith("http")) {
        const res = await getTicketmasterSuggest(artist);
        imageToUse =
          res.data._embedded?.attractions?.[0]?.images?.[0]?.url || logo;
      }

      const response = await addFavourite(artistId, artist, imageToUse);
      const artist_id = response.data.favourite.artist_id;

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

  const nextConcertDate = (localDate) => {
    if (!localDate) return null;
    const date = new Date(localDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const lastConcertDate = (eventDate) => {
    const [day, month, year] = eventDate.split("-");
    const date = new Date(`${year}-${month}-${day}`);
    if (date > new Date()) return null;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const noUpcomingConcert = setlist.filter((item) => {
    const [day, month, year] = item.eventDate.split("-");
    const date = new Date(`${year}-${month}-${day}`);
    return date < new Date();
  });

  const uniqueIds = [];
  const uniqueSetlist = noUpcomingConcert.filter((item) => {
    const isDuplicate = uniqueIds.includes(item.artist.mbid);
    if (!isDuplicate) uniqueIds.push(item.artist.mbid);
    return !isDuplicate;
  });

  if (!setlist.length || !ticketmaster) return null;

  return (
    <div className="container mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uniqueSetlist.slice(0, 3).map((setlistItem) => {
        const artistId = setlistItem.artist.mbid;
        const concertId = setlistItem.id;
        const artist = setlistItem.artist.name;
        const ticketmasterMap = attractions.find(
          (item) => item.name === artist
        );

        let spotify = null;
        let artistImage = logo;

        if (ticketmasterMap?.externalLinks?.spotify) {
          spotify = ticketmasterMap.externalLinks.spotify[0].url;
        }
        if (ticketmasterMap?.images) {
          artistImage = ticketmasterMap.images[0].url;
        }

        const artistEvents = events
          .filter((item) =>
            item._embedded?.attractions?.some((a) => a.name === artist)
          )
          .sort((a, b) =>
            a.dates.start.localDate.localeCompare(b.dates.start.localDate)
          );

        const localDate = artistEvents?.[0]?.dates?.start?.localDate || null;

        return (
          <div
            key={artistId}
            className="bg-gray-800 bg-opacity-70 rounded-xl overflow-hidden shadow-lg flex flex-col items-center p-4"
          >
            <img
              alt={artist}
              src={artistImage}
              className="w-full h-40 object-cover cursor-pointer"
              onClick={() =>
                navigate(`/artists/${artistId}/concerts/${concertId}`)
              }
            />

            <h1
              className="mt-2 text-xl text-white font-semibold cursor-pointer"
              onClick={() =>
                navigate(`/artists/${artistId}/concerts/${concertId}`)
              }
            >
              {artist}
            </h1>
            <FontAwesomeIcon
              icon="heart"
              size="2x"
              className={`favourite-icon${
                favourites.find((item) => item.artistid === artistId)
                  ? " active"
                  : ""
              }`}
              onClick={() => handleFavourite(artistId, artist, artistImage)}
            />
            <div className="search-page-box">
              <div className="next-concert">Next concert</div>
              <h3>{localDate ? nextConcertDate(localDate) : "Unavailable"}</h3>
            </div>
            <div className="search-page-box">
              <div className="last-concert">Last concert</div>
              <h3>{lastConcertDate(setlistItem.eventDate)}</h3>
            </div>
            <div className="search-page-box">
              {spotify ? (
                <>
                  <span className="spotify-play-now">Play now</span>
                  <a href={spotify} target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon
                      icon="fa-brands fa-spotify"
                      color="LimeGreen"
                      size="3x"
                      className="spotify-true"
                    />
                  </a>
                </>
              ) : (
                <FontAwesomeIcon icon="fa-brands fa-spotify" size="3x" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
