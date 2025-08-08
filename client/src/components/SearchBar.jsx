import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { useSetlistSearch, useTicketmasterSearch } from "../api/queries";

export default function SearchBar(props) {
  const { value, setValue, setSetlist, setTicketmaster } = props;
  const navigate = useNavigate();
  const { artistId } = useParams();
  const [placeholder, setPlaceholder] = useState("Search your favorite artist");

  const term = useDebounce(value, 700);

  // Usando React Query para as chamadas de API
  const { data: setlistData } = useSetlistSearch(term);
  const { data: ticketmasterData } = useTicketmasterSearch(term);

  // Atualiza os estados quando os dados chegarem
  useEffect(() => {
    if (setlistData) {
      setSetlist(setlistData.setlist || []);
    }
    if (ticketmasterData) {
      setTicketmaster(ticketmasterData._embedded || {});
    }
  }, [setlistData, ticketmasterData, setSetlist, setTicketmaster]);

  const handleChange = (event) => {
    if (artistId) {
      navigate("/search");
    }
    setValue(event.target.value);
  };

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
