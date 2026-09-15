import { useState } from 'react';

export function useAppState() {
  const [searchValue, setSearchValue] = useState('');
  const [setlist, setSetlist] = useState([]);
  const [ticketmaster, setTicketmaster] = useState({});
  // read once, on the first render, instead of an effect that re-renders with the value
  const [selectedLocation, setSelectedLocation] = useState(() =>
    JSON.parse(localStorage.getItem("selectedLocation") || "null")
  );

  const updateLocation = (location) => {
    setSelectedLocation(location);
    localStorage.setItem("selectedLocation", JSON.stringify(location));
  };

  return {
    searchValue,
    setSearchValue,
    setlist,
    setSetlist,
    ticketmaster,
    setTicketmaster,
    selectedLocation,
    updateLocation,
  };
}
