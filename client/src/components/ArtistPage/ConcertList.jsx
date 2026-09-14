import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Pagination from "../Pagination";

const PAGE_SIZE = 5;

const dateLabel = (date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function ConcertList({
  title,
  empty,
  items,
  dateOf,
  locationOf,
  linkOf,
  external,
  icon,
  iconTitle,
}) {
  const [page, setPage] = useState(0);

  const pageCount = Math.ceil(items.length / PAGE_SIZE);
  const currentPage = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      {items.length === 0 ? (
        <p className="py-2 ml-6 text-gray-500">{empty}</p>
      ) : (
        <>
          <ol className="pl-6">
            {currentPage.map((concert) => {
              const row = (
                <>
                  <span className="flex items-center space-x-2">
                    <span>{dateLabel(dateOf(concert))}</span>
                    <span className="text-gray-500 ml-2">({locationOf(concert)})</span>
                  </span>
                  <FontAwesomeIcon icon={icon} className="text-red-600" title={iconTitle} />
                </>
              );
              const className =
                "flex w-full items-center justify-between py-1 hover:text-red-800";
              const link = linkOf(concert);

              return (
                <li key={concert.id} className="border-b border-gray-300/50">
                  {!link ? (
                    <div className={className}>{row}</div>
                  ) : external ? (
                    <a className={className} href={link} target="_blank" rel="noopener noreferrer">
                      {row}
                    </a>
                  ) : (
                    <Link className={className} to={link}>
                      {row}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="ml-6">
            <Pagination currentPage={page} totalPages={pageCount} onPageChange={setPage} />
          </div>
        </>
      )}
    </>
  );
}
