import { useSearchParams } from "react-router-dom";
import { getUpcomingConcertsByArtist } from "../../helpers/selectors";
import ConcertList from "./ConcertList";
import TicketOptions from "./TicketOptions";
import HotelOptions from "./HotelOptions";
import ConcertReminder from "./ConcertReminder";

export default function UpcomingConcerts(props) {
  const events = getUpcomingConcertsByArtist(props.ticketmaster.events, props.concert.artist.name);
  const [, setSearchParams] = useSearchParams();

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
      // NextConcert reads this same "next" param to pick which upcoming show its own
      // card previews — a query param instead of local state so the Share button below
      // can just hand out the current URL and land the recipient on this exact date.
      onSelect={(concert) =>
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev);
          params.set("next", concert.id);
          return params;
        })
      }
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
