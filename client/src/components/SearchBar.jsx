import { useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { useSetlistSearch, useTicketmasterSearch } from "../api/queries";
import { AppContext } from "../context/AppContext";

export default function SearchBar() {
  const { searchValue, setSearchValue, setSetlist, setTicketmaster } = useContext(AppContext);
  const navigate = useNavigate();
  const { artistId } = useParams();
  const placeholder = "Search your favorite artist";

  const term = useDebounce(searchValue, 700);

  const { data: setlistData } = useSetlistSearch(term);
  const { data: ticketmasterData } = useTicketmasterSearch(term);

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
    <form onSubmit={(e) => e.preventDefault()} className="flex w-full mx-auto">
      <input
        type="search"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-white w-full px-4 py-3 pr-10 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm text-gray-900"
      />
    </form>
  );
}
