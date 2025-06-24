import { useEffect, useCallback, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { useNavigate, useParams } from "react-router-dom";
import { getSetlist, getTicketmaster } from "../api/api";

export default function SearchBar(props) {
  const { value, setValue, setSetlist, setTicketmaster } = props;
  const navigate = useNavigate();
  const { artistId } = useParams();
  const [placeholder, setPlaceholder] = useState("Search your favorite artist");

  const handleChange = (event) => {
    if (artistId) {
      navigate("/search");
    }
    setValue(event.target.value);
  };

  const term = useDebounce(value, 700);

  const fetchData = useCallback(() => {
    console.log("🔍 Buscando dados para:", value);

    Promise.all([getSetlist(value), getTicketmaster(value)])
      .then(([setlistResponse, ticketmasterResponse]) => {
        const setlists = setlistResponse.data.setlist || [];
        const ticketmasterData = ticketmasterResponse.data._embedded || {};

        console.log("🎵 Setlist API response:", setlists);
        console.log("🎫 Ticketmaster API response:", ticketmasterData);

        setSetlist(setlists);
        setTicketmaster(ticketmasterData);
      })
      .catch((err) => {
        console.error("Erro ao buscar dados:", err);
      });
  }, [value, setSetlist, setTicketmaster]);

  useEffect(() => {
    if (!term || term.length === 0) return;
    fetchData();
  
    // redireciona automaticamente para /search
    if (location.pathname !== "/search") {
      navigate("/search");
    }
  }, [term, fetchData]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // 768px é um breakpoint comum para mobile/tablet
        setPlaceholder("Search");
      } else {
        setPlaceholder("Search your favorite artist");
      }
    };

    // Verifica no carregamento inicial
    handleResize();
    
    // Adiciona listener para redimensionamento
    window.addEventListener('resize', handleResize);
    
    // Remove listener ao desmontar
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full mx-auto"
    >
      <input
        type="search"
        value={value}
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
