import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { faEye } from "@fortawesome/free-solid-svg-icons/faEye";
import { getSetlist, getTicketmaster } from "../../api/api";
import { getConcertTarget } from "../../helpers/concertTarget";
import { AppContext } from "../../context/AppContext";
import Icon from "../Icon";

export default function ViewConcertButton({ event, artistName }) {
  const { setSetlist, setTicketmaster } = useContext(AppContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const open = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["artist-data", artistName],
        staleTime: 10 * 60 * 1000,
        queryFn: async () => {
          const [shows, tm] = await Promise.all([
            getSetlist(artistName),
            getTicketmaster(artistName).catch(() => ({ _embedded: {} })),
          ]);
          return { setlist: shows.setlist || [], ticketmaster: tm._embedded || {} };
        },
      });
      const target = getConcertTarget(data.setlist, artistName, event.id);
      if (!target) throw new Error("No artist concert found");
      // The selected event can be absent from the artist search; retain the real
      // event clicked in Home/venue so Next Concert never selects another date.
      const ticketmaster = {
        ...data.ticketmaster,
        events: [event, ...(data.ticketmaster.events || []).filter((item) => item.id !== event.id)],
      };
      setSetlist(data.setlist);
      setTicketmaster(ticketmaster);
      navigate(target, { state: { scrollTo: "next-concert" } });
    } catch {
      setError(`Concert details for ${artistName} are unavailable. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="px-2 py-3 sm:px-4">
      <button
        type="button"
        onClick={open}
        disabled={loading}
        aria-busy={loading}
        className="w-full px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        <Icon icon={faEye} />
        {loading ? "Loading…" : "View concert"}
      </button>
      {error && (
        <p role="status" className="mt-2 text-center text-sm text-zinc-500">
          {error}
        </p>
      )}
    </div>
  );
}
