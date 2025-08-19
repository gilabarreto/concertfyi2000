import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ArtistPage from "./pages/ArtistPage";
import SearchPage from "./pages/SearchPage";
import Footer from "./components/Footer";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from './pages/Home';
import './icons';

function App() {
  const [setlist, setSetlist] = useState([]);
  const [ticketmaster, setTicketmaster] = useState([]);
  const [value, setValue] = useState("");

  return (
    <Router basename="/">
      <Navbar
        setValue={setValue}
        value={value}
        setSetlist={setSetlist}
        setTicketmaster={setTicketmaster}
      />
      <main className="pt-16 pb-16 min-h-screen w-full flex">
        <Routes>
          <Route
            path="/"
            element={
              value ? (
                <SearchPage
                  setlist={setlist}
                  ticketmaster={ticketmaster}
                />
              ) : (
                <Home
                  setSetlist={setSetlist}
                  setTicketmaster={setTicketmaster}
                />
              )
            }
          />
          <Route
            path="/search"
            element={
              <SearchPage
                setlist={setlist}
                ticketmaster={ticketmaster}
              />
            }
          />
          <Route
            path="artists/:artistId/concerts/:concertId"
            element={
              <ArtistPage
                setlist={setlist}
                ticketmaster={ticketmaster}
              />
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;