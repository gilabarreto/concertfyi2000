import { useState, useEffect } from 'react';

export function useAppState() {
  const [searchValue, setSearchValue] = useState('');
  const [setlist, setSetlist] = useState([]);
  const [ticketmaster, setTicketmaster] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("selectedLocation");
    if (saved) {
      setSelectedLocation(JSON.parse(saved));
    }
    setIsLocationLoading(false);
  }, []);

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
    isLocationLoading,
  };
}
