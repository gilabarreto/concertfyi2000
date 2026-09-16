import { useState, useContext, useRef, useEffect } from "react";
import Icon from "./Icon";
import { faXmark, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
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

export default function LocationSelector({ city, country, isLoading }) {
  const { selectedLocation, updateLocation } = useContext(AppContext);
  const [showDropdown, setShowDropdown] = useState(false);
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
    : city
      ? `${city}, ${countryCodeMap[country] || country}`
      : city;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
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
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        ref={toggleRef}
        aria-expanded={showDropdown}
        onClick={() => setShowDropdown(!showDropdown)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setShowDropdown(!showDropdown);
        }}
        className="flex justify-center items-center gap-2 cursor-pointer hover:text-gray-500 hover:opacity-90 transition bg-none border-none active:opacity-70"
        title="Change location"
      >
        <span className="text-lg font-medium tracking-tight">
          {isLoading && !selectedLocation ? "Locating..." : displayName || "Location unavailable"}
        </span>
        <Icon
          className="text-sm"
          icon={showDropdown ? faChevronUp : faChevronDown}
        />
      </button>

      {showDropdown && (
        <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[280px]">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-3 pr-10 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
              autoFocus
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors bg-none border-none p-1 cursor-pointer"
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
              className="w-full px-4 py-2 text-center text-sm text-red-600 hover:bg-red-50 border-b border-gray-200 transition-colors bg-none border-none"
            >
              Reset to Original Location
            </button>
          )}

          {showResults && (isError || suggestions.length === 0) && (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              {isError
                ? "Couldn't search cities. Try again."
                : isFetching || term !== query
                  ? "Searching…"
                  : "No cities found"}
            </div>
          )}

          {showResults && !isError && suggestions.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {suggestions.map((loc) => (
                <li key={loc.id} className="border-b border-gray-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600"
                  >
                    <span className="block font-medium text-gray-800 text-sm">{loc.city}</span>
                    <span className="block text-gray-500 text-xs">
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
