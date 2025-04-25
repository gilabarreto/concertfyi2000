import { ticketFinder } from "../../helpers/selectors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple } from "@fortawesome/free-solid-svg-icons";

export default function UpcomingConcertList(props) {
  // Extracts the relevant events from the Ticketmaster API data based on the artist's name
  const ticketmasterEvents = props.ticketmaster.events
    ? props.ticketmaster.events
        .filter((item) => {
          // Filters out events that do not have any attractions or the artist's name does not match
          if (item._embedded.attractions !== undefined) {
            for (const attraction of item._embedded.attractions) {
              if (attraction.name === props.concert.artist.name) {
                return item;
              }
            }
          }
          return item;
        })
        // Sorts the events by start date
        .sort((a, b) => a.dates.start.localDate - b.dates.start.localDate)
    : [];

  // Converts the dates of the upcoming concerts to a readable format
  const upcomingConcerts = ticketmasterEvents.map((upcomingConcert) => {
    const str = upcomingConcert.dates.start.localDate;
    const [year, month, day] = str.split("-");
    const date = new Date(year, month - 1, day);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  });

  // Creates an array of upcoming concert items to render
  const mapConcerts =
    upcomingConcerts.length > 0
      ? upcomingConcerts
          .slice(0, 10) // Limits the number of items to 10
          .map((upcomingConcert, upcomingConcertIndex) => {
            const ticketArr = ticketFinder(props.ticketmaster);
            const ticketsUrl = ticketArr[upcomingConcertIndex];
            const ticketmasterEvent = ticketmasterEvents[upcomingConcertIndex];

            return (
              <UpcomingConcertListItem
                key={upcomingConcertIndex}
                ticketsUrl={ticketsUrl}
                upcomingConcert={upcomingConcert}
                ticketmasterEvent={ticketmasterEvent}
              />
            );
          })
      : [];

  return (
    <>
      <h2 className="text-4xl font-bold mb-4">Upcoming Concerts</h2>
      <hr className="border-t border-gray-300 opacity-50 ml-6" />
      {upcomingConcerts.length === 0 ? (
        <p className="py-2">
          There are no upcoming concerts. Please come back later.
        </p>
      ) : (
        <ol className="pl-6">{mapConcerts}</ol>
      )}
    </>
  );
}

function UpcomingConcertListItem(props) {
  const { upcomingConcert, ticketsUrl, ticketmasterEvent } = props;
  // Renders an upcoming concert item with a clickable link to buy tickets
  return (
    <li
      className="flex items-center justify-between border-b border-gray-300/50 py-1"
      onClick={() => window.open(ticketsUrl, "_blank")}
    >
      <span className="flex">
        {upcomingConcert.split("-").reverse().join("-")}
        <span className="text-gray-500 ml-2">
          ({ticketmasterEvent._embedded.venues[0].city.name},{" "}
          {ticketmasterEvent._embedded.venues[0].country.name},{" "}
          {ticketmasterEvent._embedded.venues[0].country.countryCode})
        </span>
      </span>
      <FontAwesomeIcon
        icon={faTicketSimple}
        className="text-red-600 hover:text-red-800"
      />
    </li>
  );
}
