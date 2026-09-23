import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import Pagination from "../Pagination";
import { dateLabel } from "../../helpers/selectors";

const PAGE_SIZE = 5;

// items carry a dateObj. A row is either a link to one of our own routes (linkOf) or a
// disclosure that opens panels in place (expand, like Setlist does) — never both, and the
// disclosure wins. Rows used to be able to point at an outside URL too; since the next
// concerts opened a seller list instead of a single ticket link, nothing passes one.
// onSelect is optional and only fires on a disclosure row — UpcomingConcerts uses it to
// mirror the click into the URL, so the Next Concert card above stays in sync.
export default function ConcertList({
  title,
  empty,
  items,
  locationOf,
  linkOf,
  icon,
  iconTitle,
  expand,
  onSelect,
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
      <h2 className="text-3xl font-bold mb-2 text-balance">{title}</h2>
      <hr className="border-t border-zinc-300 opacity-50 ml-6" />

      {items.length === 0 ? (
        <div className="py-2 ml-6 text-zinc-500 text-pretty">
          <p>{empty}</p>
          <Link to="/" className="font-semibold text-red-600 hover:text-red-800">
            Search another artist
          </Link>
        </div>
      ) : (
        <>
          <ol className="pl-6">
            {currentPage.map((concert) => {
              const open = openId === concert.id;
              // the date never truncates; a long city name does, so the icon keeps its place
              const label = (
                <span className="flex min-w-0 items-center">
                  <span className="tabular-nums">{dateLabel(concert.dateObj)}</span>
                  <span className="text-zinc-500 ml-2 truncate">- {locationOf(concert)}</span>
                </span>
              );
              const className =
                "flex w-full items-center justify-between gap-2 py-2 hover:text-red-800";

              if (expand) {
                return (
                  <li key={concert.id} className="border-b border-zinc-300/50">
                    <button
                      type="button"
                      className={className}
                      onClick={() => {
                        setOpenId(open ? null : concert.id);
                        onSelect?.(concert);
                      }}
                      aria-expanded={open}
                      title={iconTitle}
                    >
                      {label}
                      <Icon
                        icon={open ? faChevronUp : faChevronDown}
                        className="text-red-600 shrink-0"
                      />
                    </button>
                    {open && expand(concert)}
                  </li>
                );
              }

              return (
                <li key={concert.id} className="border-b border-zinc-300/50">
                  <Link to={linkOf(concert)} className={className} title={iconTitle}>
                    {label}
                    {/* the row text already names the concert, so the icon is decoration */}
                    <Icon icon={icon} className="text-red-600 shrink-0" />
                  </Link>
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
