import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import { faBell, faMoon, faUser } from "@fortawesome/free-solid-svg-icons";

const phrases = [
  "Find Your Inspiration",
  "Follow Your Instinct",
  "Fuel Your Imagination",
  "Forge Your Identity",
  "Find Your Identity",
  "Free Your Imagination",
  "Feed Your Imagination",
  "Follow Your Intuition",
  "Follow Your Instincts",
  "Fuel Your Intensity",
  "Forge Your Independence",
  "Free Your Identity",
  "Follow Your Impulse",
  "Fuel Your Ideas",
  "Follow Your Inspiration",
  "Feed Your Inspiration",
  "Feed Your Interest",
  "Fuel Your Inspiration",
  "Find Your Interest",
  "Find Your Itinerary",
];

function Navbar() {
  const [phrase, setPhrase] = useState("");
  const timerRef = useRef(null);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const expandLogo = () => {
    if (logoBusy) return;
    setLogoBusy(true);
    setPhrase(phrases[Math.floor(Math.random() * phrases.length)].toLowerCase());
    timerRef.current = setTimeout(() => {
      setPhrase("");
      timerRef.current = setTimeout(() => setLogoBusy(false), 300);
    }, 5000);
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow z-20">
      <nav className="grid grid-cols-[1fr_auto_1fr] w-full max-w-[1200px] mx-auto items-center px-3 sm:px-6 py-4 h-16 font-sans gap-2">
        <button
          type="button"
          disabled
          aria-label="Notifications (coming soon)"
          title="Notifications (coming soon)"
          className="flex items-center justify-center justify-self-start min-h-11 px-1 text-xl text-red-600 cursor-default"
        >
          <Icon icon={faBell} />
        </button>
        <button
          type="button"
          onClick={expandLogo}
          disabled={logoBusy}
          aria-label="concertfyi — reveal a phrase"
          className="justify-self-center inline-flex items-center font-medium tracking-tight text-xl sm:text-2xl"
        >
          <span>concert{"{"}</span>
          <span
            className="inline-block overflow-hidden text-ellipsis whitespace-nowrap text-center font-semibold text-red-600 transition-[width] duration-300 ease-in-out motion-reduce:transition-none"
            style={{ width: phrase ? `min(${phrase.length * 0.57}em, 40vw)` : "1.3em" }}
          >
            {phrase || "fyi"}
          </span>
          <span>{"}"}</span>
        </button>

        <div className="flex items-center justify-self-end gap-2 sm:gap-4 text-red-600">
          <button
            type="button"
            disabled
            aria-label="Dark mode (coming soon)"
            title="Dark mode (coming soon)"
            className="flex shrink-0 items-center justify-center min-h-11 px-1 text-xl cursor-default"
          >
            <Icon icon={faMoon} />
          </button>
          <button
            type="button"
            disabled
            aria-label="User profile (coming soon)"
            title="User profile (coming soon)"
            className="flex shrink-0 items-center justify-center min-h-11 px-1 text-xl cursor-default"
          >
            <Icon icon={faUser} />
          </button>
        </div>
      </nav>

      <hr className="border-t border-gray-200" />
    </header>
  );
}

export default Navbar;
