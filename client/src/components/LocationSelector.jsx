import { useState, useContext, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faXmark } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../context/AppContext";
import cities from "../data/cities.json";

// Simple fuzzy search scoring
function fuzzyScore(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (t.startsWith(q)) return 100;
  if (t.includes(q)) return 50;

  let score = 0;
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += 10;
      qIdx++;
    }
  }

  return qIdx === q.length ? score : 0;
}

export default function LocationSelector({ city, country, isLoading }) {
  const { selectedLocation, updateLocation } = useContext(AppContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const dropdownRef = useRef(null);

  const displayName = selectedLocation
    ? `${selectedLocation.city}, ${selectedLocation.countryCode || selectedLocation.country}`
    : city ? `${city}, ${country}` : city;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value.length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = cities
      .map((c) => ({
        ...c,
        score: Math.max(fuzzyScore(value, c.city), fuzzyScore(value, c.country)),
      }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ score, ...c }) => c);

    setSuggestions(filtered);
  };

  const handleSelectLocation = (location) => {
    updateLocation(location);
    setShowDropdown(false);
    setSearchInput("");
    setSuggestions([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex justify-center items-center gap-2 cursor-pointer hover:text-gray-500 hover:underline hover:underline-offset-8 hover:opacity-90 transition-all duration-300 ease-in-out bg-none border-none p-0"
        title="Change location"
      >
        <FontAwesomeIcon
          className="text-xl tracking-tight font-bold text-red-600 px-1"
          icon={faLocationDot}
          aria-hidden="true"
        />
        <span className="hidden sm:block text-xl font-medium tracking-tight">
          {isLoading ? "Locating..." : displayName || "Location unavailable"}
        </span>
      </button>


      {showDropdown && (
        <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[280px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search location..."
              value={searchInput}
              onChange={handleSearch}
              className="w-full px-4 py-3 pr-10 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
              autoFocus
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSuggestions([]);
                  updateLocation(null);
                  setShowDropdown(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors bg-none border-none p-1 cursor-pointer"
                title="Reset to original location"
              >
                <FontAwesomeIcon icon={faXmark} size="sm" />
              </button>
            )}
          </div>

          {suggestions.length === 0 && searchInput && (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              No cities found
            </div>
          )}

          {suggestions.length > 0 && (
            <ul className="max-h-72 overflow-y-auto">
              {suggestions.map((loc, idx) => (
                <li
                  key={`${loc.city}-${loc.country}-${idx}`}
                  onClick={() => handleSelectLocation(loc)}
                  className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="font-medium text-gray-800 text-sm">
                    {loc.city}
                  </div>
                  <div className="text-gray-500 text-xs">{loc.country}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
