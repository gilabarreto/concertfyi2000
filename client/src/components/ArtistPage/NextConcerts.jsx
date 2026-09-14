import { faTicketSimple } from "@fortawesome/free-solid-svg-icons";
import ConcertList from "./ConcertList";

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
      dateOf={(concert) => concert.dateObj}
      locationOf={(concert) => {
        const venue = concert._embedded.venues?.[0];
        return venue ? `${venue.city.name}, ${venue.country.countryCode}` : "Unknown location";
      }}
      linkOf={(concert) => concert.url}
      external
      icon={faTicketSimple}
      iconTitle="Buy tickets"
    />
  );
}
