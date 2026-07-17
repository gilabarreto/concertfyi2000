import { useState } from "react";
import { ticketFinder } from "../../helpers/selectors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple } from "@fortawesome/free-solid-svg-icons";
import Pagination from "../Pagination";

export default function NextConcerts(props) {
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const ticketmasterEvents = props.ticketmaster.events
    ? props.ticketmaster.events
        .filter((item) =>
          item._embedded.attractions?.some(
            (a) => a.name === props.concert.artist.name
          )
        )
        .sort(
          (a, b) =>
            new Date(a.dates.start.localDate) -
            new Date(b.dates.start.localDate)
        )
    : [];


  const totalConcerts = ticketmasterEvents.length;
  const pageCount = Math.ceil(totalConcerts / pageSize);

  const sliceStart = page * pageSize;
  const sliceEnd = sliceStart + pageSize;
  const currentPage = ticketmasterEvents.slice(sliceStart, sliceEnd);

  return (
    <>
      <h2 className="text-4xl font-bold mb-4">Next Concerts</h2>
      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      {totalConcerts === 0 ? (
        <p className="py-2 ml-6 text-gray-500">
          There are no upcoming concerts. Please check back later.
        </p>
      ) : (
        <>
          <ol className="pl-6">
            {currentPage.map((concert, concertIndex) => {
              const dateString = concert.dates.start.localDate;
              const [year, month, day] = dateString.split("-");
              const date = new Date(year, month - 1, day);
              const dateLabel = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              const ticketsUrl = ticketFinder(props.ticketmaster)[
                sliceStart + concertIndex
              ];

              const venue = concert._embedded.venues?.[0];
              const concertLocation = venue
                ? `${venue.city.name}, ${venue.country.countryCode}`
                : "Unknown location";

              return (
                <li
                  key={concert.id}
                  className="flex items-center justify-between border-b border-gray-300/50 py-1"
                >
                  <span
                    className="cursor-pointer flex items-center space-x-2"
                    onClick={() => window.open(ticketsUrl, "_blank")}
                  >
                    <span>{dateLabel}</span>
                    <span className="text-gray-500 ml-2">
                      ({concertLocation})
                    </span>
                  </span>

                  <FontAwesomeIcon
                    icon={faTicketSimple}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                    onClick={() => window.open(ticketsUrl, "_blank")}
                    title="Buy tickets"
                  />
                </li>
              );
            })}
          </ol>

          <div className="ml-6">
            <Pagination
              currentPage={page}
              totalPages={pageCount}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </>
  );
}
