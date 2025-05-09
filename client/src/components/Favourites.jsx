import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { deleteFavourite } from "../api/api";

export default function Favourites(props) {
  const navigate = useNavigate();
  const { favouritesTickets, favouritesConcerts } = props;

  const handleDelete = async (artistId) => {
    try {
      await deleteFavourite(artistId);
      props.setFavourites((prev) =>
        [...prev].filter((item) => item.artist_id !== artistId)
      );
      navigate("/favourite");
    } catch (error) {
      console.log("Error:", error);
      alert("Failed to delete favourite.");
    }
  };

  const nextConcertDate = (localDate) => {
    if (!localDate) return null;
    const [year, month, day] = localDate.split("-");
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const lastConcertDate = (eventDate) => {
    const [day, month, year] = eventDate.split("-");
    const date = new Date(year, month - 1, day);
    if (date > new Date()) return null;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  let spotify = null;

  if (props.loadingfavourites) {
    return <h1 className="favourite-text">Loading..</h1>;
  }

  if (!props.loadingfavourites && props.favourites.length === 0) {
    return null;
  }

  return (
    <>
      {props.favourites.map((favourite) => {
        const artist = favourite.artistname;
        const artistImage = favourite.artistimage;
        const artistId = favourite.artist_id;

        return (
          <div key={artistId} className="search-page-card">
            <div className="search-page-image-box">
              <img src={artistImage} className="search-page-image" alt={`${artist}`} />
            </div>

            <div className="search-page-info-box">
              <h1 className="search-artist">{artist}</h1>
            </div>

            <FontAwesomeIcon
              icon="trash"
              size="2x"
              className="delete-icon"
              onClick={() => handleDelete(artistId)}
            />

            <div className="search-page-box">
              <div className="next-concert">Next concert</div>
              <h3>
                {favouritesTickets.find((item) => item.artistname === artist)
                  ? nextConcertDate(
                      favouritesTickets.find((item) => item.artistname === artist).lastConcert
                    )
                  : "Unavailable"}
              </h3>
            </div>

            <div className="search-page-box">
              <div className="last-concert">Last concert</div>
              <h3>
                {favouritesConcerts.find((item) => item.artistname === artist)
                  ? lastConcertDate(
                      favouritesConcerts.find((item) => item.artistname === artist).lastConcert
                    )
                  : "Unavailable"}
              </h3>
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
    </>
  );
}