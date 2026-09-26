import { useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { useSetlistSearch, useTicketmasterSearch } from "../api/queries";
import { AppContext } from "../context/AppContext";
import Icon from "./Icon";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function SearchBar({ onClose }) {
  const { searchValue, setSearchValue, setSetlist, setTicketmaster } = useContext(AppContext);
  const navigate = useNavigate();
  const { artistId } = useParams();
  const placeholder = "Search your favorite artist";

  const term = useDebounce(searchValue, 700);

  const setlistSearch = useSetlistSearch(term);
  const ticketmasterSearch = useTicketmasterSearch(term);
  const setlistData = setlistSearch.data;
  const ticketmasterData = ticketmasterSearch.data;
  // Timeout ou API fora: sem isto a busca terminava calada, sem resultado nem aviso.
  const searchFailed = setlistSearch.isError || ticketmasterSearch.isError;
  const retry = () => {
    setlistSearch.refetch();
    ticketmasterSearch.refetch();
  };

  useEffect(() => {
    if (setlistData) {
      setSetlist(setlistData.setlist || []);
    }
    if (ticketmasterData) {
      setTicketmaster(ticketmasterData._embedded || {});
    }
  }, [setlistData, ticketmasterData, setSetlist, setTicketmaster]);

  const handleChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);

    if (value.trim()) {
      // Navega para search se houver texto e não estiver já na rota de artista
      if (!artistId) {
        navigate("/search");
      }
    }
  };

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth < 768) {
  //       setPlaceholder("Search");
  //     } else {
  //       setPlaceholder("Search your favorite artist");
  //     }
  //   };

  //   handleResize();

  //   window.addEventListener("resize", handleResize);

  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="relative flex w-full mx-auto">
      <input
        type="search"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-white w-full px-4 py-3 pr-10 border-b border-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm text-zinc-900"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        title="Close search"
        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-zinc-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
      >
        <Icon icon={faXmark} />
      </button>
      {searchFailed && (
        <p
          role="alert"
          className="absolute left-0 top-full mt-1 w-full bg-white px-4 py-2 text-sm text-zinc-500 shadow"
        >
          Search failed.{" "}
          <button
            type="button"
            onClick={retry}
            className="font-semibold text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </p>
      )}
    </form>
  );
}
