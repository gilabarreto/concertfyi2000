import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { getLastConcertsByArtist } from "../../helpers/selectors";
import Pagination from "../Pagination";

export default function LastConcerts(props) {
  const navigate = useNavigate();
  const pageSize = 5;
  const [page, setPage] = useState(0);

  const setlistEvents = getLastConcertsByArtist(props.setlist, props.artistId);
  const totalConcerts = setlistEvents.length;
  const pageCount = Math.ceil(totalConcerts / pageSize);

  const sliceStart = page * pageSize;
  const sliceEnd = sliceStart + pageSize;
  const currentPage = setlistEvents.slice(sliceStart, sliceEnd);

  return (
    <>
      <h2 className="text-4xl font-bold mb-4">Last Concerts</h2>
      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      {totalConcerts === 0 ? (
        <span className="py-2 ml-6 text-gray-500">
          There are no recent concerts. Please check back later.
        </span>
      ) : (
        <>
          <ol className="pl-6">
            {currentPage.map((concert) => {
              const [day, month, year] = concert.eventDate.split("-");
              const date = new Date(year, month - 1, day);
              const dateLabel = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              const city = concert.venue.city?.name || "";
              const country = concert.venue.city?.country.code || "";

              return (
                <li
                  key={concert.id}
                  className="flex items-center justify-between border-b border-gray-300/50 py-1"
                >
                  <span
                    className="cursor-pointer flex items-center space-x-2"
                    onClick={() =>
                      navigate(`/artists/${props.artistId}/concerts/${concert.id}`)
                    }
                  >
                    <span>{dateLabel}</span>
                    <span className="text-gray-500 ml-2">
                      ({city}, {country})
                    </span>
                  </span>

                  <FontAwesomeIcon
                    icon={faRotateLeft}
                    className="cursor-pointer text-red-600 hover:text-red-800"
                    title="Go to concert"
                    onClick={() =>
                      navigate(`/artists/${props.artistId}/concerts/${concert.id}`)
                    }
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
