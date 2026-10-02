import { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import ReminderClose from "../components/ReminderClose";
import Swiper from "../components/Swiper";
import { SEOHead } from "../components/SEOHead";
import { useLocalEvents } from "../api/queries";
import { getUpcomingConcertsByCity } from "../helpers/selectors";
import ConcertList from "../components/ArtistPage/ConcertList";
import TicketOptions from "../components/ArtistPage/TicketOptions";
import HotelOptions from "../components/ArtistPage/HotelOptions";
import ConcertReminder from "../components/ArtistPage/ConcertReminder";

// Hardcoded enquanto o layout assenta — trocar por geolocation/busca depois.
const CALGARY = { lat: 51.0447, long: -114.0719, name: "Calgary" };

// Local/TicketWeb shows often carry no attraction entity at all — just the event's own
// name (e.g. "Gedfest Yeg"). That's still a real name, so it beats "Unknown artist".
const artistOf = (concert) =>
  concert._embedded?.attractions?.[0]?.name || concert.name || "Unknown artist";

const expandConcert = (concert) => {
  const artistName = artistOf(concert);
  return (
    <>
      <TicketOptions event={concert} artistName={artistName} />
      <HotelOptions event={concert} />
      <ConcertReminder event={concert} artistName={artistName} />
    </>
  );
};

const Home = () => {
  const {
    setConcertReminder,
    reminderOpen,
    setReminderOpen,
    reminderInteracted,
    setReminderInteracted,
  } = useContext(AppContext);
  useEffect(() => {
    setConcertReminder({ id: "home-intro", pathname: "/", targetId: "home-reminder" });
    setReminderOpen(false);
    setReminderInteracted(false);
    return () => setConcertReminder(null);
  }, [setConcertReminder, setReminderOpen, setReminderInteracted]);

  useEffect(() => {
    if (reminderInteracted) return;
    let closeTimer;
    const openTimer = setTimeout(() => {
      setReminderOpen(true);
      closeTimer = setTimeout(() => setReminderOpen(false), 5000);
    }, 10000);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [reminderInteracted, setReminderOpen]);

  const { data: localEventsData } = useLocalEvents(CALGARY.lat, CALGARY.long);
  const events = localEventsData?._embedded?.events || [];
  const inCity = getUpcomingConcertsByCity(events, CALGARY.name);
  const nearby = getUpcomingConcertsByCity(events, CALGARY.name, false);

  return (
    <>
      <SEOHead
        title="Discover Live Music & Concerts"
        description="Track your favorite artists, explore past performances, and never miss a concert again. Find setlists, venues, and ticket information."
        url="/"
      />
      <div className="flex flex-col w-full flex-1 items-center gap-6 overflow-x-clip p-4">
        <div className="flex flex-col w-[calc(100%+2rem)] -mx-4 -mt-4 items-center">
          <div
            id="home-reminder"
            aria-hidden={!reminderOpen}
            inert={!reminderOpen ? "" : undefined}
            className={`grid w-full scroll-mt-16 transition-[grid-template-rows] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${reminderOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="relative bg-red-600">
                <p className="w-full bg-red-600 px-12 py-3 text-center text-sm sm:text-base text-white text-pretty">
                  Track your favorite artists, explore past performances and never miss a concert
                  again.
                </p>
                <ReminderClose />
              </div>
            </div>
          </div>
          {/* Palco do Cover Flow: faixa zinc de ponta a ponta da coluna (DESIGN.md). */}
          <div className="w-full shrink-0 bg-zinc-100 shadow-[inset_0_-8px_8px_-8px_theme(colors.zinc.300)] px-4 pt-4 pb-2">
            <Swiper />
          </div>
        </div>

        {/* Sem artist-card-grid: sem divisória entre as duas listas. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="min-w-0 bg-white p-6 space-y-2">
            <ConcertList
              title="Upcoming Concerts"
              empty={`No upcoming concerts in ${CALGARY.name} right now.`}
              items={inCity}
              locationOf={artistOf}
              iconTitle="Get tickets"
              expand={expandConcert}
            />
          </div>

          <div className="min-w-0 bg-white p-6 space-y-2">
            <ConcertList
              title="Concerts Near You"
              empty="No concerts found nearby."
              items={nearby}
              locationOf={(concert) => {
                const venue = concert._embedded?.venues?.[0];
                const parts = [venue?.city?.name, venue?.country?.countryCode].filter(Boolean);
                return `${artistOf(concert)} - ${parts.join(", ") || "Unknown location"}`;
              }}
              iconTitle="Get tickets"
              expand={expandConcert}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
