import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useAppState } from "./hooks/useAppState";
import { AppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Home from "./pages/Home";

// Home fica no bundle inicial — é a porta de entrada. O resto carrega sob demanda:
// ArtistPage sozinha arrasta o Google Maps, que a maioria das visitas nunca abre.
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ArtistPage = lazy(() => import("./pages/ArtistPage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const SpotifyCallback = lazy(() => import("./pages/SpotifyCallback"));

function App() {
  const appState = useAppState();

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
            {/* Só as rotas: um erro de página não leva Navbar e Footer junto. */}
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="w-full flex items-center justify-center p-6">Loading…</div>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/artists/:artistId/concerts/:concertId" element={<ArtistPage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/callback" element={<SpotifyCallback />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          {!isSpotifyPopup && <Footer />}
        </Router>
      </AppContext.Provider>
    </HelmetProvider>
  );
}

export default App;
