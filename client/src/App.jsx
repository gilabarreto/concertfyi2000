import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useAppState } from "./hooks/useAppState";
import { AppContext } from "./context/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
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
          <main className={isSpotifyPopup ? "" : "min-h-dvh w-full bg-red-600 flex justify-center"}>
            {!isSpotifyPopup &&
              ["left", "right"].map((side) => (
                <div
                  key={side}
                  aria-hidden="true"
                  className="fixed top-16 bottom-16 hidden min-[1044.44px]:flex pointer-events-none text-white"
                  style={{ [side]: 0, width: "calc((100% - 1012.44px) / 2)" }}
                >
                  <svg
                    viewBox="0 0 32 100"
                    className="m-4 flex-1 min-w-0 scale-[0.7]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    focusable="false"
                  >
                    <path
                      d={
                        side === "left"
                          ? "M 27 3 C 16 3 16 10 16 18 L 16 35 C 16 44 12 48 5 50 C 12 52 16 56 16 65 L 16 82 C 16 90 16 97 27 97"
                          : "M 5 3 C 16 3 16 10 16 18 L 16 35 C 16 44 20 48 27 50 C 20 52 16 56 16 65 L 16 82 C 16 90 16 97 5 97"
                      }
                    />
                  </svg>
                </div>
              ))}
            <div
              className={
                isSpotifyPopup ? "w-full" : "w-full max-w-[1012.44px] bg-white pt-16 pb-16 flex"
              }
            >
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
            </div>
          </main>
          {!isSpotifyPopup && <Footer />}
        </Router>
      </AppContext.Provider>
    </HelmetProvider>
  );
}

export default App;
