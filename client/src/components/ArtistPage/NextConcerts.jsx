import { faTicketSimple } from "@fortawesome/free-solid-svg-icons";
import ConcertList from "./ConcertList";
import TicketOptions from "./TicketOptions";

export default function NextConcerts(props) {
  const events = (props.ticketmaster.events || [])
    .filter((item) =>
      item._embedded.attractions?.some((a) => a.name === props.concert.artist.name)
    )
    .map((item) => {
      const [year, month, day] = item.dates.start.localDate.split("-");
      return { ...item, dateObj: new Date(year, month - 1, day) };
    })
    .sort((a, b) => a.dateObj - b.dateObj);

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
      icon={faTicketSimple}
      iconTitle="Where to buy"
      expand={(concert) => (
        <TicketOptions event={concert} artistName={props.concert.artist.name} />
      )}
    />
  );
}
