import { useQuery } from '@tanstack/react-query';
import { getTicketmasterSuggest, getSetlist, getLocalEvents, getTicketmaster } from './api';

export const useTicketmasterSuggest = (artistName) => {
  return useQuery({
    queryKey: ['ticketmaster-suggest', artistName],
    queryFn: () => getTicketmasterSuggest(artistName).then(res => res.data),
    enabled: !!artistName,
    staleTime: 10 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
};

export const useTicketmasterSearch = (artistName) => {
  return useQuery({
    queryKey: ['ticketmaster-search', artistName],
    queryFn: () => getTicketmaster(artistName).then(res => res.data),
    enabled: !!artistName,
  });
};

export const useArtistData = (artistName) => {
  return useQuery({
    queryKey: ['artist-data', artistName],
    queryFn: async () => {
      try {
        const [setlistRes, ticketmasterRes] = await Promise.all([
          getSetlist(artistName).catch(err => {
            console.error("Erro no setlist:", err);
            return { data: { setlist: [] } };
          }),
          getTicketmaster(artistName).catch(err => {
            console.error("Erro no ticketmaster:", err);
            return { data: { _embedded: {} } };
          }),
        ]);

        return {
          setlist: setlistRes?.data?.setlist || [],
          ticketmaster: ticketmasterRes?.data?._embedded || {},
        };
      } catch (error) {
        console.error("Erro geral na query:", error);
        throw error;
      }
    },
    enabled: !!artistName,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};