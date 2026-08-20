import { useState, useContext, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faXmark } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../context/AppContext";

export default function LocationSelector({ city, isLoading }) {
  const { selectedLocation, updateLocation } = useContext(AppContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = selectedLocation
    ? `${selectedLocation.city}, ${selectedLocation.country}`
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

  const searchCities = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/locations?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data.locations || []);
    } catch (err) {
      console.error("Error searching cities:", err);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    searchCities(value);
  };

  const handleSelectLocation = (location) => {
    updateLocation(location);
    setShowDropdown(false);
    setSearchInput("");
    setSuggestions([]);
  };

  const handleClearLocation = (e) => {
    e.stopPropagation();
    updateLocation(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex justify-center items-center gap-2 cursor-pointer hover:text-gray-500 hover:underline hover:underline-offset-8 hover:opacity-90 transition-all duration-300 ease-in-out"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FontAwesomeIcon
          className="text-xl tracking-tight font-bold text-red-600 px-1"
          icon={faLocationDot}
          aria-hidden="true"
        />
        <span className="hidden sm:block text-xl font-medium tracking-tight">
          {isLoading ? "Locating..." : displayName || "Location unavailable"}
        </span>
      </div>

      {selectedLocation && (
        <button
          onClick={handleClearLocation}
          className="absolute right-0 top-0 text-gray-400 hover:text-red-600 transition-colors"
          title="Clear location"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[250px]">
          <input
            type="text"
            placeholder="Search city..."
            value={searchInput}
            onChange={handleSearch}
            className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
            autoFocus
          />

          {searching && (
            <div className="px-4 py-2 text-center text-gray-500 text-sm">
              Searching...
            </div>
          )}

          {!searching && suggestions.length === 0 && searchInput && (
            <div className="px-4 py-2 text-center text-gray-500 text-sm">
              No cities found
            </div>
          )}

          {!searching && suggestions.length > 0 && (
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((loc, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectLocation(loc)}
                  className="px-4 py-2 hover:bg-red-50 cursor-pointer text-sm border-b border-gray-200 last:border-0"
                >
                  <div className="font-medium text-gray-800">
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
