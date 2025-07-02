import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ArtistPage from "./components/ArtistPage";
import SearchPage from "./components/SearchPage";
import Footer from "./components/Footer";
import Swiper from "./components/Swiper";
import About from "./components/About";
import Contact from "./components/Contact";
import './icons';


function App() {
  const [setlist, setSetlist] = useState([]);
  const [ticketmaster, setTicketmaster] = useState([]);
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);
  const [token, setToken] = useState("");
  const [value, setValue] = useState("");
  const [favourites, setFavourites] = useState([]);
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
      <main className="pt-16 pb-16 min-h-screen w-full box-border flex">
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
                <div className="flex flex-col items-center justify-evenly w-full flex-1 m-4">                      <Swiper
                  setSetlist={setSetlist}
                  setTicketmaster={setTicketmaster}
                  setCity={setCity}
                />
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

          <Route
            path="/about"
            element={
              <>
                <About />
              </>
            }
          />
          <Route
            path="/contact"
            element={
              <>
                <Contact />
              </>
            }
          />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
