import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useAppState } from "./hooks/useAppState";
import { AppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { routes } from "./config/routes";
import './icons';

function App() {
  const appState = useAppState();
  const { searchValue } = appState;

  // Handle GitHub Pages 404.html redirect for OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const originalPath = urlParams.get("originalPath");

  if (code && originalPath === "/callback") {
    // Redirect to /callback with code preserved
    window.history.replaceState({}, document.title, "/callback" + window.location.search);
  }

  return (
    <HelmetProvider>
      <AppContext.Provider value={appState}>
        <Router basename="/">
          <Navbar />
          <main className="pt-16 pb-16 min-h-screen w-full flex">
            <Routes>
              {routes.map((route) => {
                const Component = route.element;
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<Component />}
                  />
                );
              })}
            </Routes>
          </main>
          <Footer />
        </Router>
      </AppContext.Provider>
    </HelmetProvider>
  );
}

export default App;