import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ArtistPage from "./components/ArtistPage";
import SearchPage from "./components/SearchPage";
import Favourites from "./components/Favourites";
import Footer from "./components/Footer";
import Swiper from "./components/Swiper";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faHeart, faMusic, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getFavourites, getSetlist, getTicketmaster } from "./api/api";

function App() {
  const [setlist, setSetlist] = useState([]);
  const [ticketmaster, setTicketmaster] = useState([]);
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);
  const [token, setToken] = useState("");
  const [value, setValue] = useState("");
  const [favourites, setFavourites] = useState([]);
  const [loadingfavourites, setLoadingfavourites] = useState(false);
  const [favouritesConcerts, setFavouritesConcerts] = useState([]);
  const [favouritesTickets, setFavouritesTickets] = useState([]);

  const fetchDataByFavourite = useCallback((favourite) => {
    Promise.all([
      getSetlist(favourite.artistname),
      getTicketmaster(favourite.artistname),
    ])
      .then(([setlistResponse, ticketmasterResponse]) => {
        const filteredSetlist =
          setlistResponse.data.setlist?.filter((item) => {
            const [day, month, year] = item.eventDate.split("-");
            return new Date(`${year}-${month}-${day}`) < new Date();
          }) || [];

        const uniqueArtists = [];
        const uniqueSetlist = filteredSetlist.filter((item) => {
          if (!uniqueArtists.includes(item.artist.mbid)) {
            uniqueArtists.push(item.artist.mbid);
            return true;
          }
          return false;
        });

        setFavouritesConcerts((prev) => [
          ...prev,
          {
            artistname: favourite.artistname,
            lastConcert: uniqueSetlist[0]?.eventDate || null,
          },
        ]);

        const events = ticketmasterResponse.data._embedded?.events || [];
        const nextEvent = events.find((event) =>
          event._embedded?.attractions?.some(
            (a) => a.name === favourite.artistname
          )
        );

        setFavouritesTickets((prev) => [
          ...prev,
          {
            artistname: favourite.artistname,
            upcomingConcert: nextEvent?.dates?.start?.localDate || null,
          },
        ]);
      })
      .catch((err) => console.error("Erro ao buscar dados por favorito:", err));
  }, []);

  useEffect(() => {
    setLoadingfavourites(true);
    getFavourites()
      .then((res) => {
        setFavourites(res.data);
        setLoadingfavourites(false);
      })
      .catch(() => setLoadingfavourites(false));
  }, []);

  useEffect(() => {
    if (favourites.length) {
      favourites.forEach(fetchDataByFavourite);
    }
  }, [fetchDataByFavourite, favourites]);

  library.add(fab, faHeart, faMusic, faTrash);

  return (
    <Router>
      <Navbar
        setValue={setValue}
        value={value}
        setSetlist={setSetlist}
        setTicketmaster={setTicketmaster}
        setLat={setLat}
        setLong={setLong}
      />
      <div className="pt-16 pb-24 mx-16">
        <Routes>
          <Route
            path="/favourite"
            element={
              <Favourites
                loadingfavourites={loadingfavourites}
                setFavourites={setFavourites}
                favourites={favourites}
                setlist={setlist}
                ticketmaster={ticketmaster}
                setGlobalSpotifyToken={setToken}
                favouritesConcerts={favouritesConcerts}
                favouritesTickets={favouritesTickets}
              />
            }
          />

          <Route
            path="/"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-gray-800 tracking-tight">
                Live Music Lives Here.
                </h1>
                <div className="w-full max-w-7xl">
                  <Swiper
                    setSetlist={setSetlist}
                    setTicketmaster={setTicketmaster}
                  />
                </div>
              </div>
            }
          />

          <Route
            path="/search"
            element={
              <>
                <SearchPage
                  favourites={favourites}
                  setFavourites={setFavourites}
                  setlist={setlist}
                  ticketmaster={ticketmaster}
                />
              </>
            }
          />

          <Route
            path="artists/:artistId/concerts/:concertId"
            element={
              <ArtistPage
                setlist={setlist}
                ticketmaster={ticketmaster}
                lat={lat}
                long={long}
                token={token}
              />
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
