import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { useSetlistSearch, useTicketmasterSearch } from "../api/queries";
import { AppContext } from "../context/AppContext";

export default function SearchBar() {
  const { searchValue, setSearchValue, setSetlist, setTicketmaster } = useContext(AppContext);
  const navigate = useNavigate();
  const { artistId } = useParams();
  const [placeholder, setPlaceholder] = useState("Search your favorite artist");

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setPlaceholder("Search");
      } else {
        setPlaceholder("Search your favorite artist");
      }
    };

    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full mx-auto"
    >
      <input
        type="search"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="
        flex h-10  max-w-xs px-4 rounded-full
          bg-red-600 placeholder-white text-white
          ring-0
          focus:outline-none
          focus:ring-2
          focus:ring-black lg:w-96
        "
      />
      
    </form>
  );
}
