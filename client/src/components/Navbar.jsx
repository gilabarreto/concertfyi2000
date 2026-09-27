import { useState, useRef, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
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
  const { concertReminder, reminderOpen, setReminderOpen, setReminderInteracted } =
    useContext(AppContext);
  const reminderTarget = concertReminder?.targetId || "nearby-concert-reminder";
  const reminderCount = concertReminder?.pathname === pathname ? 1 : 0;
  const toggleReminder = () => {
    setReminderInteracted(true);
    setReminderOpen(!reminderOpen);
    if (!reminderOpen)
      requestAnimationFrame(() => {
        document.getElementById(reminderTarget)?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      });
  };
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
        className={`grid grid-cols-[1fr_auto_1fr] w-full max-w-[1012.44px] mx-auto items-center px-3 sm:px-6 py-4 h-16 font-sans gap-2 ${redNavbar ? "bg-red-600 text-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.3)]" : pathname === "/" || pathname.startsWith("/artists/") ? "bg-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.3)]" : "bg-white border-b border-zinc-200"}`}
      >
        <button
          type="button"
          disabled={!reminderCount}
          onClick={toggleReminder}
          aria-label={reminderCount ? "Concert reminders: 1" : "No concert reminders"}
          aria-expanded={reminderCount ? reminderOpen : undefined}
          aria-controls={reminderCount ? reminderTarget : undefined}
          title={reminderCount ? "Concert reminders: 1" : "No concert reminders"}
          className={`flex items-center justify-center justify-self-start min-h-11 px-1 text-xl ${iconColor} disabled:cursor-default hover:opacity-80`}
        >
          <Icon icon={faBell} />
          {reminderCount > 0 && (
            <span
              className="-ml-0.5 mt-1 flex h-4 w-4 shrink-0 self-start items-center justify-center rounded-full bg-red-600 pt-px text-xs font-bold leading-none text-white"
              aria-hidden="true"
            >
              {reminderCount}
            </span>
          )}
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
