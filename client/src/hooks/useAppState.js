import { useEffect, useState } from "react";

export function useAppState() {
  const [goingConcertIds, setGoingConcertIds] = useState(() =>
    JSON.parse(localStorage.getItem("goingConcertIds") || "[]"),
  );
  useEffect(() => {
    localStorage.setItem("goingConcertIds", JSON.stringify(goingConcertIds));
  }, [goingConcertIds]);
  const toggleGoingConcert = (concertId) => {
    setGoingConcertIds((ids) =>
      ids.includes(concertId) ? ids.filter((id) => id !== concertId) : [...ids, concertId],
    );
  };
  const [concertReminder, setConcertReminder] = useState(null);
  const [reminderInteracted, setReminderInteracted] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderSeen, setReminderSeen] = useState(false);
  useEffect(() => {
    if (reminderOpen) setReminderSeen(true);
  }, [reminderOpen]);
  const [searchValue, setSearchValue] = useState("");
  const [setlist, setSetlist] = useState([]);
  const [ticketmaster, setTicketmaster] = useState({});
  // read once, on the first render, instead of an effect that re-renders with the value
  const [selectedLocation, setSelectedLocation] = useState(() =>
    JSON.parse(localStorage.getItem("selectedLocation") || "null"),
  );

  const updateLocation = (location) => {
    setSelectedLocation(location);
    localStorage.setItem("selectedLocation", JSON.stringify(location));
  };

  return {
    goingConcertIds,
    toggleGoingConcert,
    concertReminder,
    setConcertReminder,
    reminderInteracted,
    setReminderInteracted,
    reminderOpen,
    setReminderOpen,
    reminderSeen,
    setReminderSeen,
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
