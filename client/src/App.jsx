import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAppState } from "./hooks/useAppState";
import { AppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { routes } from "./config/routes";
import './icons';

function App() {
  const appState = useAppState();
  const { searchValue } = appState;

  return (
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
  );
}

export default App;