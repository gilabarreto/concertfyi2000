import { Link, useLocation } from "react-router-dom";
import { useState, useContext, useRef, useEffect } from "react";
import {
  faHouse,
  faCircleInfo,
  faEnvelope,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";
import SearchBar from "./SearchBar";
import LocationSelector from "./LocationSelector";
import { useGeolocation } from "../hooks/useGeolocation";
import { AppContext } from "../context/AppContext";

export default function Footer() {
  const { pathname } = useLocation();
  const showDivider = /^\/(about|contact)\/?$/.test(pathname);
  const { setSearchValue } = useContext(AppContext);
  const { city, country, isLoading } = useGeolocation();
  const [openPanel, setOpenPanel] = useState(null);
  const footerRef = useRef(null);
  const searchButtonRef = useRef(null);
  const searchPanelRef = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (!footerRef.current?.contains(event.target)) setOpenPanel(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    if (openPanel === "search") searchPanelRef.current?.querySelector("input")?.focus();
  }, [openPanel]);

  const toggle = (panel) => setOpenPanel((current) => (current === panel ? null : panel));
  const closeAndNavigate = () => {
    setSearchValue("");
    setOpenPanel(null);
  };
  const navLinks = [
    { path: "/about", label: "About", icon: faCircleInfo },
    { path: "/contact", label: "Contact", icon: faEnvelope },
  ];
  const panelClass =
    "absolute bottom-full left-0 w-full bg-red-600 text-white shadow-md border-b border-white/20 px-6 py-4";
  const buttonClass =
    "flex shrink-0 items-center justify-center gap-2 min-h-11 px-1 text-xl font-normal hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

  return (
    <footer
      ref={footerRef}
      className="fixed bottom-0 left-0 w-full bg-red-600 text-white z-20"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || openPanel !== "search") return;
        searchButtonRef.current?.focus();
        setOpenPanel(null);
      }}
    >
      <nav
        aria-label="Footer navigation"
        className={`relative flex w-full max-w-[1012.44px] mx-auto justify-evenly items-center h-16 px-3 sm:px-6 gap-3 sm:gap-6 font-sans font-normal ${showDivider ? "bg-red-600 shadow-[0_-4px_6px_-4px_rgba(0,0,0,0.3)]" : ""}`}
      >
        {/* Concave ramps join the main's sides smoothly to the footer. */}
        {!showDivider && (
          <>
            <div
              aria-hidden="true"
              className="hidden min-[1012.44px]:block absolute bottom-full left-0 w-5 h-5 pointer-events-none bg-[radial-gradient(circle_at_top_right,_transparent_19.5px,_#dc2626_20px)]"
            />
            <div
              aria-hidden="true"
              className="hidden min-[1012.44px]:block absolute bottom-full right-0 w-5 h-5 pointer-events-none bg-[radial-gradient(circle_at_top_left,_transparent_19.5px,_#dc2626_20px)]"
            />
          </>
        )}
        <Link to="/" aria-label="Home" onClick={closeAndNavigate} className={buttonClass}>
          <Icon icon={faHouse} />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <button
          ref={searchButtonRef}
          type="button"
          aria-label="Search artists"
          aria-expanded={openPanel === "search"}
          aria-controls="footer-search"
          onClick={() => toggle("search")}
          className={buttonClass}
        >
          <Icon icon={faMagnifyingGlass} />
          <span className="hidden sm:inline">Search</span>
        </button>
        <div className="min-w-0 [&>div>button]:max-w-full [&>div>button>span]:truncate">
          <LocationSelector
            city={city}
            country={country}
            isLoading={isLoading}
            placement="top"
            isOpen={openPanel === "location"}
            onOpenChange={(open) =>
              setOpenPanel((current) =>
                open ? "location" : current === "location" ? null : current,
              )
            }
          />
        </div>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            aria-label={link.label}
            onClick={closeAndNavigate}
            className="flex shrink-0 items-center gap-2 min-h-11 text-xl font-normal hover:opacity-80 transition-opacity"
          >
            <Icon icon={link.icon} />
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        ))}
        {openPanel === "search" && (
          <div
            id="footer-search"
            ref={searchPanelRef}
            className={`${panelClass} [&_form]:max-w-xl`}
          >
            <SearchBar
              onClose={() => {
                setOpenPanel(null);
                searchButtonRef.current?.focus();
              }}
            />
          </div>
        )}
      </nav>
    </footer>
  );
}
