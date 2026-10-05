import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons/faChevronUp";
import Pagination from "../Pagination";
import { dateLabel } from "../../helpers/selectors";
import CardTitle from "./CardTitle";
import CardNotice from "./CardNotice";

import { useT } from "../../i18n";
// items carry a dateObj. A row is either a link to one of our own routes (linkOf) or a
// disclosure that opens panels in place (expand, like Setlist does) — never both, and the
// disclosure wins. Rows used to be able to point at an outside URL too; since the next
// concerts opened a seller list instead of a single ticket link, nothing passes one.
// onSelect is optional and only fires on a disclosure row — UpcomingConcerts uses it to
// mirror the click into the URL, so the Next Concert card above stays in sync.
export default function ConcertList({
  title,
  empty,
  showSearch = true,
  items,
  locationOf,
  secondaryTextOf,
  linkOf,
  icon,
  iconTitle,
  expand,
  onSelect,
  pageSize = 5,
}) {
  const t = useT();
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);

  const pageCount = Math.ceil(items.length / pageSize);
  const currentPage = items.slice(page * pageSize, page * pageSize + pageSize);

  const goToPage = (next) => {
    setOpenId(null);
    setPage(next);
  };

  return (
    <>
      <CardTitle>{title}</CardTitle>

      {items.length === 0 ? (
        <CardNotice>
          <p>{empty}</p>
          {showSearch && (
            <Link to="/" className="font-semibold text-red-600 hover:text-red-800">
              {t("Search another artist")}
            </Link>
          )}
        </CardNotice>
      ) : (
        <>
          <ol className="px-[12px]">
            {currentPage.map((concert) => {
              const open = openId === concert.id;
              // the date never truncates; a long city name does, so the icon keeps its place
              const secondaryText = secondaryTextOf?.(concert);
              const label = secondaryText ? (
                <span className="flex min-w-0 items-start text-left">
                  <span className="tabular-nums whitespace-nowrap shrink-0">
                    {dateLabel(concert.dateObj)}
                  </span>
                  <span className="mx-2 text-zinc-500" aria-hidden="true">
                    ·
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-zinc-500">{locationOf(concert)}</span>
                    <span className="text-xs text-zinc-500">{secondaryText}</span>
                  </span>
                </span>
              ) : (
                <span className="flex min-w-0 items-center">
                  <span className="tabular-nums whitespace-nowrap shrink-0">
                    {dateLabel(concert.dateObj)}
                  </span>
                  <span className="text-zinc-500 ml-2 truncate">· {locationOf(concert)}</span>
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

          <div>
            <Pagination currentPage={page} totalPages={pageCount} onPageChange={goToPage} />
          </div>
        </>
      )}
    </>
  );
}
