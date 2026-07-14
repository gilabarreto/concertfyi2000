import { useState } from 'react';

export function useAppState() {
  const [searchValue, setSearchValue] = useState('');
  const [setlist, setSetlist] = useState([]);
  const [ticketmaster, setTicketmaster] = useState({});

  return {
    searchValue,
    setSearchValue,
    setlist,
    setSetlist,
    ticketmaster,
    setTicketmaster,
  };
}
