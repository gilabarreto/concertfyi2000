import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const { pathname } = useLocation();
  const redNavbar = /^\/(about|contact)\/?$/.test(pathname);
  const iconColor = redNavbar ? "text-white" : "text-red-600";
  const [phrase, setPhrase] = useState("");
  const logoRef = useRef(null);
  const [phraseSize, setPhraseSize] = useState(null);
  const timerRef = useRef(null);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!phrase) return;
    const fitPhrase = () => {
      const style = getComputedStyle(logoRef.current);
      const context = document.createElement("canvas").getContext("2d");
      context.font = `600 ${style.fontSize} ${style.fontFamily}`;
      context.letterSpacing = style.letterSpacing;
      const naturalWidth = context.measureText(phrase).width + 4;
      const availableWidth = window.innerWidth * 0.4;
      const scale = Math.min(1, availableWidth / naturalWidth);
      setPhraseSize({ width: naturalWidth * scale, fontSize: parseFloat(style.fontSize) * scale });
    };
    fitPhrase();
    window.addEventListener("resize", fitPhrase);
    return () => window.removeEventListener("resize", fitPhrase);
  }, [phrase]);

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
    <header className="fixed top-0 left-0 w-full bg-red-600 z-20">
      <nav
        className={`grid grid-cols-[1fr_auto_1fr] w-full max-w-[1012.44px] mx-auto items-center px-3 sm:px-6 py-4 h-16 font-sans gap-2 ${redNavbar ? "bg-red-600 text-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.3)]" : "bg-white border-b border-zinc-200"}`}
      >
        <button
          type="button"
          disabled
          aria-label="Notifications (coming soon)"
          title="Notifications (coming soon)"
          className={`flex items-center justify-center justify-self-start min-h-11 px-1 text-xl ${iconColor} cursor-default`}
        >
          <Icon icon={faBell} />
        </button>
        <button
          ref={logoRef}
          type="button"
          onClick={expandLogo}
          disabled={logoBusy}
          aria-label="concertfyi — reveal a phrase"
          className="justify-self-center inline-flex items-center font-medium tracking-tight text-xl sm:text-2xl"
        >
          <span>concert</span>
          <span className={redNavbar ? "text-black" : undefined}>{"{"}</span>
          <span
            className={`inline-block overflow-hidden whitespace-nowrap text-center font-semibold ${iconColor} transition-[width] duration-300 ease-in-out motion-reduce:transition-none`}
            style={phrase ? phraseSize : { width: "1.3em" }}
          >
            {phrase || "fyi"}
          </span>
          <span className={redNavbar ? "text-black" : undefined}>{"}"}</span>
        </button>

        <div className={`flex items-center justify-self-end gap-1 sm:gap-2 ${iconColor}`}>
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
    </header>
  );
}

export default Navbar;
