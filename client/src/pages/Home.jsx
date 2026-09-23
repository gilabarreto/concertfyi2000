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
        <div className="flex flex-col w-full items-center gap-2">
          <div className="w-full shrink-0">
            <Swiper />
          </div>

          <hr className="w-[calc(100%+2rem)] -mx-4 border-zinc-300" />
        </div>

        <div className="artist-card-grid grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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
