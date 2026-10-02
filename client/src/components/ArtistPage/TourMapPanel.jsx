import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { useTourSetlists } from "../../api/queries";
import { dateLabel } from "../../helpers/selectors";
import { TourMap } from "./Map";
import { getTourMapData, findTourUpcomingEvent } from "../../helpers/tourStats";

export default function TourMapPanel({ artistId, tourName, popup = false, onNavigate }) {
  const { ticketmaster, setSetlist } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, isError } = useTourSetlists(artistId, tourName);
  const { shows, past, upcoming, points } = getTourMapData(data?.setlist, artistId, tourName);

  const selectPoint = (point) => {
    const params = new URLSearchParams(location.search);
    if (point.upcoming) {
      const event = findTourUpcomingEvent(point.show, ticketmaster?.events);
      if (!event) {
        setSetlist((previous) =>
          previous.some((show) => show.id === point.show.id) ? previous : [...previous, point.show],
        );
      }
      params.set("next", event?.id || `setlist:${point.show.id}`);
      onNavigate?.();
      navigate(
        {
          pathname: event ? location.pathname : `/artists/${artistId}/concerts/${point.show.id}`,
          search: `?${params}`,
        },
        { state: { scrollTo: "next-concert" } },
      );
    } else {
      setSetlist((previous) =>
        previous.some((show) => show.id === point.show.id) ? previous : [...previous, point.show],
      );
      params.delete("next");
      onNavigate?.();
      navigate(
        {
          pathname: `/artists/${artistId}/concerts/${point.show.id}`,
          search: params.size ? `?${params}` : "",
        },
        { state: { scrollTo: "last-concert" } },
      );
    }
  };
  const firstDate = shows[0]?.date;
  const lastDate = shows.at(-1)?.date;
  const dates = firstDate
    ? shows.length === 1
      ? dateLabel(firstDate)
      : `${firstDate.getFullYear() === lastDate.getFullYear() ? dateLabel(firstDate).replace(/, \d{4}$/, "") : dateLabel(firstDate)} – ${dateLabel(lastDate)}`
    : null;

  return (
    <div className="bg-white" aria-label={`Tour map: ${tourName}`}>
      <div className={popup ? "aspect-video w-full" : "aspect-[103/60] w-full"}>
        {isLoading || isError || !points.length ? (
          <p className="flex h-full items-center justify-center text-sm text-zinc-500">
            {isLoading
              ? "Loading tour map…"
              : isError
                ? "Tour map unavailable. Try again later."
                : "No locations available for this tour."}
          </p>
        ) : (
          <TourMap points={points} onSelect={selectPoint} />
        )}
      </div>
      {!isLoading && !isError && (
        <div className="px-1 py-2 text-zinc-500">
          <p className="flex items-center justify-center gap-2 whitespace-nowrap text-[10px] sm:text-xs">
            {dates && <span>Dates: {dates}</span>}
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Past: {past}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border-2 border-red-600" />
              Upcoming: {upcoming}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
