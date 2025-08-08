// hooks/useConcertData.js
import { useQuery } from '@tanstack/react-query';
import { getSetlist, getTicketmaster } from '../api/api';

export function useConcertData(artistName) {
  const enabled = !!artistName?.length;

  const setlistQuery = useQuery({
    queryKey: ['setlist', artistName],
    queryFn: () => getSetlist(artistName).then(res => res.data.setlist),
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const ticketmasterQuery = useQuery({
    queryKey: ['ticketmaster', artistName],
    queryFn: () => getTicketmaster(artistName).then(res => res.data._embedded || {}),
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  return {
    setlist: setlistQuery.data || [],
    ticketmaster: ticketmasterQuery.data || {},
    isLoading: setlistQuery.isLoading || ticketmasterQuery.isLoading,
    isError: setlistQuery.isError || ticketmasterQuery.isError,
  };
}
