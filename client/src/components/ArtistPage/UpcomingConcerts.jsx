import { getUpcomingConcertsByArtist } from "../../helpers/selectors";
import ConcertList from "./ConcertList";
import TicketOptions from "./TicketOptions";
import HotelOptions from "./HotelOptions";
import ConcertReminder from "./ConcertReminder";

export default function UpcomingConcerts(props) {
  const events = getUpcomingConcertsByArtist(props.ticketmaster.events, props.concert.artist.name);

  return (
    <ConcertList
      title="Upcoming Concerts"
      empty="No upcoming concerts. Check back later."
      items={events}
      locationOf={(concert) => {
        // Parte dos eventos internacionais da Ticketmaster vem com venue sem city.
        // O guard ia só até venues[0], então city.name derrubava a árvore de rotas inteira.
        const venue = concert._embedded?.venues?.[0];
        const parts = [venue?.city?.name, venue?.country?.countryCode].filter(Boolean);
        return parts.join(", ") || "Unknown location";
      }}
      iconTitle="Get tickets"
      expand={(concert) => (
        <>
          <TicketOptions event={concert} artistName={props.concert.artist.name} />
          <HotelOptions event={concert} />
          <ConcertReminder event={concert} artistName={props.concert.artist.name} />
        </>
      )}
    />
  );
}
