import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/queryClient";

// No refresh mobile, comece no topo em vez de repetir o destino da navegação anterior.
// Links abertos normalmente e navegação dentro da página continuam usando seus destinos.
if (
  performance.getEntriesByType("navigation")[0]?.type === "reload" &&
  window.matchMedia("(max-width: 1023px)").matches &&
  window.location.pathname.startsWith("/artists/")
) {
  window.history.scrollRestoration = "manual";
  const state = window.history.state;
  const userState = { ...state?.usr };
  delete userState.scrollTo;
  window.history.replaceState(
    { ...state, usr: state?.usr ? userState : null },
    "",
    window.location.pathname + window.location.search,
  );
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

// Before the first render, so a dark visitor never sees a white page. The CSP forbids an
// inline script in index.html, so this is as early as it gets. No choice saved yet: follow
// the system.
const savedTheme = localStorage.getItem("theme");
document.documentElement.classList.toggle(
  "dark",
  savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches,
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
