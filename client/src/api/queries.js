import { useQuery } from '@tanstack/react-query';
import { getTicketmasterSuggest, getSetlist, getLocalEvents, getTicketmaster } from './api';

export const useTicketmasterSuggest = (artistName) => {
  return useQuery({
    queryKey: ['ticketmaster-suggest', artistName], // Chave única para o cache
    queryFn: () => getTicketmasterSuggest(artistName).then(res => res.data),
    enabled: !!artistName, // Só executa quando artistName existe
    staleTime: 10 * 60 * 1000, // 10 minutos para esta query específica
  });
};

export const useSetlistSearch = (artistName) => {
  return useQuery({
    queryKey: ['setlist-search', artistName],
    queryFn: () => getSetlist(artistName).then(res => res.data),
    enabled: !!artistName,
    staleTime: 10 * 60 * 1000,
  });
};

export const useLocalEvents = (lat, long) => {
  return useQuery({
    queryKey: ['local-events', lat, long],
    queryFn: () => getLocalEvents(lat, long).then(res => res.data),
    enabled: !!lat && !!long,
    staleTime: 5 * 60 * 1000, // 5 minutos para eventos locais
  });
};

export const useTicketmasterSearch = (artistName) => {
  return useQuery({
    queryKey: ['ticketmaster-search', artistName],
    queryFn: () => getTicketmaster(artistName).then(res => res.data),
    enabled: !!artistName,
  });
};