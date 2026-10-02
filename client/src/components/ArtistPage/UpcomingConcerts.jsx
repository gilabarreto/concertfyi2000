import { Link, useLocation, useSearchParams } from "react-router-dom";
import { faBuilding, faEye } from "@fortawesome/free-solid-svg-icons";
import Icon from "../Icon";
import { getUpcomingConcertsByArtist } from "../../helpers/selectors";
import ConcertList from "./ConcertList";
import TicketOptions from "./TicketOptions";
import HotelOptions from "./HotelOptions";
import ConcertReminder from "./ConcertReminder";

export default function UpcomingConcerts(props) {
  const events = getUpcomingConcertsByArtist(props.ticketmaster.events, props.concert.artist.name);
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();

  return (
    <ConcertList
      title="Upcoming Concerts"
      empty="No upcoming concerts. Check back later."
      showSearch={false}
      items={events}
      actions={
        // Same pill as SHARE / I WAS THERE. The venue is the open concert's (setlist.fm id);
        // Ticketmaster's upcoming venues don't carry one.
        props.concert.venue?.id && (
          <Link
            to={`/venues/${props.concert.venue.id}`}
            title={`Past and upcoming concerts at ${props.concert.venue.name}`}
            className="flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-300 text-[12px] leading-4 text-zinc-500 whitespace-nowrap transition-colors hover:border-red-600 hover:text-red-600"
          >
            <Icon icon={faBuilding} className="text-[0.65rem]" />
            VENUE
          </Link>
        )
      }
      locationOf={(concert) => {
        // Parte dos eventos internacionais da Ticketmaster vem com venue sem city.
        // O guard ia só até venues[0], então city.name derrubava a árvore de rotas inteira.
        const venue = concert._embedded?.venues?.[0];
        const parts = [venue?.city?.name, venue?.country?.countryCode].filter(Boolean);
        return parts.join(", ") || "Unknown location";
      }}
      iconTitle="Get tickets"
      // NextConcert reads this same "next" param to pick which upcoming show its own
      // card previews; View concert also sets this ID before scrolling to the card.
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
          <ConcertReminder
            event={concert}
            artistName={props.concert.artist.name}
            showShare={false}
          />
          <div className="flex justify-center px-2 py-3 sm:px-4">
            <Link
              to={{
                pathname: location.pathname,
                search: `?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(location.search)), next: concert.id })}`,
              }}
              state={{ scrollTo: "next-concert" }}
              className="w-full px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Icon icon={faEye} />
              View concert
            </Link>
          </div>
        </>
      )}
    />
  );
}
