import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ArtistPage from "./components/ArtistPage";
import SearchPage from "./components/SearchPage";
import Footer from "./components/Footer";
import Swiper from "./components/Swiper";

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
  const [city, setCity] = useState("");

  return (
    <Router>
      <Navbar
        setValue={setValue}
        value={value}
        setSetlist={setSetlist}
        setTicketmaster={setTicketmaster}
        setLat={setLat}
        setLong={setLong}
        lat={lat}
        long={long}
        city={city}
      />
      <div className="pt-16 pb-16 w-full">
        <Routes>
          <Route
            path="/"
            element={
              value ? (
                <SearchPage
                  favourites={favourites}
                  setFavourites={setFavourites}
                  setlist={setlist}
                  ticketmaster={ticketmaster}
                />
              ) : (
                <div className="min-h-full flex flex-col items-center justify-center px-4 py-4">
                  <h1 className="text-3xl font-medium tracking-tight items-center my-4">
                    concert{"{"}
                    <span className="text-3xl tracking-tight font-bold text-red-600">
                      fyi
                    </span>
                    {"}"}
                  </h1>
                  <div className="w-full">
                    <Swiper
                      setSetlist={setSetlist}
                      setTicketmaster={setTicketmaster}
                      setCity={setCity}
                    />
                  </div>
                </div>
              )
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
