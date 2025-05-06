import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { getPreviousConcertsByArtist } from "../../helpers/selectors";

export default function PreviousConcerts(props) {
  const navigate = useNavigate();
  const pageSize = 5;
  const [page, setPage] = useState(0);

  const setlistEvents = getPreviousConcertsByArtist(props.setlist, props.artistId);
  console.log("setlistEvents:", setlistEvents, "artistId:", props.artistId);
  
  const totalConcerts = setlistEvents.length;
  const pageCount = Math.ceil(totalConcerts / pageSize);

  const sliceStart = page * pageSize;
  const sliceEnd = sliceStart + pageSize;
  const currentPage = setlistEvents.slice(sliceStart, sliceEnd);

  return (
    <>
      <h2 className="text-4xl font-bold mb-4">Previous Concerts</h2>
      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      {totalConcerts === 0 ? (
        <p className="py-2 ml-6">
          There are no previous concerts. Please check back later.
        </p>
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
                      navigate(
                        `/artists/${props.artistId}/concerts/${concert.id}`
                      )
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
                    onClick={() =>
                      navigate(
                        `/artists/${props.artistId}/concerts/${concert.id}`
                      )
                    }
                  />
                </li>
              );
            })}
          </ol>

          <div className="flex items-center justify-center space-x-2 mt-4 ml-6">
            <button
              className="px-2 py-1 rounded disabled:opacity-50"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              &lt; Prev
            </button>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                className={`px-2 py-1 rounded ${
                  i === page
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-2 py-1 rounded disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pageCount - 1}
            >
              Next &gt;
            </button>
          </div>
        </>
      )}
    </>
  );
}
