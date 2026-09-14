import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useAppState } from "./hooks/useAppState";
import { AppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import ArtistPage from "./pages/ArtistPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SpotifyCallback from "./pages/SpotifyCallback";
import './icons';

function App() {
  const appState = useAppState();
  const { searchValue } = appState;

  // Handle GitHub Pages 404.html redirect for Spotify OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code && window.location.pathname === "/") {
    // Spotify redirect came through 404.html, navigate to /callback
    window.history.replaceState({}, document.title, "/callback" + window.location.search);
  }

  // Don't show navbar/footer in Spotify callback popup
  const isSpotifyPopup = window.location.pathname === "/callback" && window.opener !== null;

  return (
    <HelmetProvider>
      <AppContext.Provider value={appState}>
        <Router basename="/">
          {!isSpotifyPopup && <Navbar />}
          <main className={isSpotifyPopup ? "" : "pt-16 pb-16 min-h-dvh w-full flex"}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/artists/:artistId/concerts/:concertId" element={<ArtistPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/callback" element={<SpotifyCallback />} />
            </Routes>
          </main>
          {!isSpotifyPopup && <Footer />}
        </Router>
      </AppContext.Provider>
    </HelmetProvider>
  );
}

export default App;