import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import Pagination from "../Pagination";

const PAGE_SIZE = 5;

const dateLabel = (date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// items carry a dateObj; linkOf returns an app path, or an http URL for an outside link.
// expand turns the row into a disclosure instead of a link, like Setlist does.
export default function ConcertList({
  title,
  empty,
  items,
  locationOf,
  linkOf,
  icon,
  iconTitle,
  expand,
}) {
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);

  const pageCount = Math.ceil(items.length / PAGE_SIZE);
  const currentPage = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const goToPage = (next) => {
    setOpenId(null);
    setPage(next);
  };

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
              const open = openId === concert.id;
              const label = (
                <span className="flex items-center space-x-2">
                  <span>{dateLabel(concert.dateObj)}</span>
                  <span className="text-gray-500 ml-2">({locationOf(concert)})</span>
                </span>
              );
              const className =
                "flex w-full items-center justify-between py-1 hover:text-red-800";
              const link = linkOf(concert);

              if (expand) {
                return (
                  <li key={concert.id} className="border-b border-gray-300/50">
                    <button
                      type="button"
                      className={className}
                      onClick={() => setOpenId(open ? null : concert.id)}
                      aria-expanded={open}
                      title={iconTitle}
                    >
                      {label}
                      <span className="flex items-center space-x-2 pl-2">
                        <FontAwesomeIcon icon={icon} className="text-red-600" aria-hidden="true" />
                        <FontAwesomeIcon
                          icon={open ? faChevronUp : faChevronDown}
                          className="text-red-600"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                    {open && expand(concert)}
                  </li>
                );
              }

              const row = (
                <>
                  {label}
                  <FontAwesomeIcon icon={icon} className="text-red-600" title={iconTitle} />
                </>
              );

              return (
                <li key={concert.id} className="border-b border-gray-300/50">
                  {!link ? (
                    <div className={className}>{row}</div>
                  ) : link.startsWith("http") ? (
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
            <Pagination currentPage={page} totalPages={pageCount} onPageChange={goToPage} />
          </div>
        </>
      )}
    </>
  );
}
