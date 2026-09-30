import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { useGeolocation } from "../../hooks/useGeolocation";
import { getNearbyConcert } from "../../helpers/nearbyConcert";
import { dateLabel } from "../../helpers/selectors";
import ReminderClose from "../ReminderClose";
import Icon from "../Icon";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import "./NearbyConcertBanner.css";

export default function NearbyConcertBanner({ artist, events }) {
  const {
    selectedLocation,
    setConcertReminder,
    reminderInteracted,
    setReminderInteracted,
    reminderOpen,
    setReminderOpen,
    goingConcertIds,
    toggleGoingConcert,
  } = useContext(AppContext);
  const { coords, isLoading, error } = useGeolocation();
  const location = useLocation();
  const navigate = useNavigate();
  const effectiveCoords = selectedLocation
    ? { lat: selectedLocation.lat, long: selectedLocation.lon }
    : !isLoading && !error
      ? coords
      : null;
  const event = getNearbyConcert(events, artist, effectiveCoords);
  const eventId = event?.id;
  useEffect(() => {
    setConcertReminder(eventId ? { id: eventId, pathname: location.pathname } : null);
    setReminderOpen(false);
    setReminderInteracted(false);
    return () => setConcertReminder(null);
  }, [eventId, location.pathname, setConcertReminder, setReminderOpen, setReminderInteracted]);

  useEffect(() => {
    if (!eventId || reminderInteracted) return;
    const timer = setTimeout(() => setReminderOpen(true), 5000);
    return () => clearTimeout(timer);
  }, [eventId, location.pathname, reminderInteracted, setReminderOpen]);
  if (!event) return null;

  const venue = event._embedded?.venues?.[0];
  const imGoing = goingConcertIds.includes(event.id);
  const handleGoing = () => {
    toggleGoingConcert(event.id);
    const params = new URLSearchParams(location.search);
    params.set("next", event.id);
    navigate(
      { pathname: location.pathname, search: `?${params}` },
      { state: { scrollTo: "next-concert" } },
    );
  };

  return (
    <div
      id="nearby-concert-reminder"
      aria-hidden={!reminderOpen}
      inert={!reminderOpen ? "" : undefined}
      data-open={reminderOpen}
      className="nearby-concert-banner scroll-mt-16"
      role="status"
    >
      <div className="min-h-0 overflow-hidden">
        <div className="relative">
          <p className="bg-red-600 px-12 py-3 text-center text-sm sm:text-base text-white text-pretty">
            {artist} are playing {venue?.city?.name || "near you"} on {dateLabel(event.dateObj)}
            {venue?.name ? ` at ${venue.name}` : ""}.{" "}
            <button
              type="button"
              onClick={handleGoing}
              aria-pressed={imGoing}
              title={imGoing ? "Remove from concerts you're going to" : "Mark that you're going"}
              className={`inline-flex items-center gap-1 ml-2 rounded-full border border-white px-2 py-0.5 text-[12px] leading-4 whitespace-nowrap align-middle transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${imGoing ? "bg-white text-red-600" : "text-white hover:bg-white/10"}`}
            >
              <Icon icon={imGoing ? faCheck : faPlus} className="text-[0.65rem]" />
              I'M GOING
            </button>
          </p>
          <ReminderClose />
        </div>
      </div>
    </div>
  );
}
