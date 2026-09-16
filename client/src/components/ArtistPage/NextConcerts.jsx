import { getNextConcertsByArtist } from "../../helpers/selectors";
import ConcertList from "./ConcertList";
import TicketOptions from "./TicketOptions";
import HotelOptions from "./HotelOptions";
import ConcertReminder from "./ConcertReminder";

export default function NextConcerts(props) {
  const events = getNextConcertsByArtist(props.ticketmaster.events, props.concert.artist.name);

  return (
    <ConcertList
      title="Next Concerts"
      empty="No upcoming concerts. Check back later."
      items={events}
      locationOf={(concert) => {
        const venue = concert._embedded.venues?.[0];
        return venue ? `${venue.city.name}, ${venue.country.countryCode}` : "Unknown location";
      }}
      linkOf={(concert) => concert.url}
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
