import { useState, useContext, useRef, useEffect } from "react";
import Icon from "./Icon";
import {
  faXmark,
  faChevronDown,
  faChevronUp,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../context/AppContext";
import { useCitySearch } from "../api/queries";
import useDebounce from "../hooks/useDebounce";

// Country to code mapping for geolocation display
const countryCodeMap = {
  Brazil: "BR",
  Canada: "CAN",
  "United States": "US",
  Mexico: "MX",
  Argentina: "AR",
  Chile: "CL",
  Colombia: "CO",
  Peru: "PE",
  Venezuela: "VE",
  Spain: "ES",
  Portugal: "PT",
  "United Kingdom": "GB",
  France: "FR",
  Germany: "DE",
  Netherlands: "NL",
  Italy: "IT",
  Austria: "AT",
  "Czech Republic": "CZ",
  Poland: "PL",
  Australia: "AU",
  Japan: "JP",
  "South Korea": "KR",
};

export default function LocationSelector({
  city,
  country,
  isLoading,
  placement = "bottom",
  isOpen,
  onOpenChange,
}) {
  const { selectedLocation, updateLocation } = useContext(AppContext);
  const [localOpen, setLocalOpen] = useState(false);
  const showDropdown = isOpen ?? localOpen;
  const setShowDropdown = (open) => {
    setLocalOpen(open);
    onOpenChange?.(open);
  };
  const [searchInput, setSearchInput] = useState("");
  const dropdownRef = useRef(null);
  const toggleRef = useRef(null);
  const inputRef = useRef(null);

  const query = searchInput.trim();
  const term = useDebounce(query, 300);
  const { data: suggestions = [], isFetching, isError } = useCitySearch(term);
  const showResults = query.length >= 2;

  const displayName = selectedLocation
    ? `${selectedLocation.city}, ${selectedLocation.countryCode || selectedLocation.country}`
    : // sem cidade ainda, devolve o próprio valor vazio — quem desenha cai no fallback
      city && `${city}, ${countryCodeMap[country] || country}`;

  // A lista vazia tem três motivos diferentes e eles não são intercambiáveis: deu erro,
  // ainda está buscando, ou buscou e não achou. `term !== query` é o intervalo em que o
  // debounce ainda não alcançou o que foi digitado — ali ainda é "procurando".
  const emptyMessage = () => {
    if (isError) return "Couldn't search cities. Try again.";
    if (isFetching || term !== query) return "Searching…";
    return "No cities found";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLocalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      toggleRef.current?.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    // arrows move focus between the search input and the suggestion buttons
    const items = [...dropdownRef.current.querySelectorAll("input, li button")];
    const i = items.indexOf(document.activeElement);
    const next =
      items[Math.min(Math.max(i + (e.key === "ArrowDown" ? 1 : -1), 0), items.length - 1)];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  const handleSelectLocation = (location) => {
    updateLocation(location);
    setShowDropdown(false);
    setSearchInput("");
  };

  return (
    <div className="static" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        ref={toggleRef}
        aria-expanded={showDropdown}
        onClick={() => setShowDropdown(!showDropdown)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setShowDropdown(!showDropdown);
        }}
        className="flex justify-center items-center gap-2 cursor-pointer hover:text-zinc-500 hover:opacity-90 transition bg-none border-none active:opacity-70"
        title="Change location"
      >
        <Icon icon={faLocationDot} className="shrink-0 text-xl" />
        <span
          className={`tracking-tight ${placement === "top" ? "text-xl font-normal" : "text-lg font-medium"}`}
        >
          {isLoading && !selectedLocation ? "Locating..." : displayName || "Location unavailable"}
        </span>
        <Icon className="text-sm" icon={showDropdown ? faChevronUp : faChevronDown} />
      </button>

      {showDropdown && (
        <div
          className={
            placement === "top"
              ? "absolute bottom-full left-0 w-full bg-red-600 text-zinc-900 shadow-md border-b border-white/20 px-6 py-4 [&>div]:max-w-xl [&>div]:mx-auto [&>ul]:max-w-xl [&>ul]:mx-auto [&>ul]:bg-white [&>button]:bg-white [&>button]:max-w-xl [&>button]:mx-auto [&>button]:block"
              : "absolute top-full left-0 w-full bg-white text-zinc-900 border-t border-zinc-200 shadow-md z-50 px-6 py-4 max-h-[calc(100dvh-8rem)] overflow-y-auto [&>div]:max-w-xl [&>div]:mx-auto [&>ul]:max-w-xl [&>ul]:mx-auto [&>button]:max-w-xl [&>button]:mx-auto [&>button]:block"
          }
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white w-full px-4 py-3 pr-10 border-b border-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
              autoFocus
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-600 transition-colors bg-none border-none p-1 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <Icon icon={faXmark} size="sm" />
              </button>
            )}
          </div>

          {selectedLocation && (
            <button
              onClick={() => {
                updateLocation(null);
                setSearchInput("");
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-center text-sm text-red-600 hover:bg-red-50 border-b border-zinc-200 transition-colors bg-none border-none"
            >
              Reset to Original Location
            </button>
          )}

          {showResults && (isError || suggestions.length === 0) && (
            <div className="bg-white px-4 py-3 text-center text-zinc-500 text-sm">
              {emptyMessage()}
            </div>
          )}

          {showResults && !isError && suggestions.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {suggestions.map((loc) => (
                <li key={loc.id} className="border-b border-zinc-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600"
                  >
                    <span className="block font-medium text-zinc-800 text-sm">{loc.city}</span>
                    <span className="block text-zinc-500 text-xs">
                      {[loc.state, loc.country].filter(Boolean).join(", ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
