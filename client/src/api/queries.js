import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getSetlist, getSetlistById, getLocalEvents, getTicketmaster, searchCities, getLyrics, getYoutubeVideo } from './api';
import { findTrackUri } from '../helpers/spotifyPlaylist';
import { clearAccessToken } from '../helpers/spotifyAuth';

// Song details don't change: cache for the session instead of the 1s global gcTime,
// so reopening a song is instant (and saves YouTube API quota). "Not found" is a normal answer, no retry.
const songCache = { staleTime: Infinity, gcTime: 30 * 60 * 1000, retry: false };

export const useLyrics = (artist, song) => {
  return useQuery({
    queryKey: ['lyrics', artist, song],
    queryFn: () => getLyrics(artist, song).then(res => res.data.lyrics || ""),
    ...songCache,
  });
};

export const useYoutubeVideo = (artist, song) => {
  return useQuery({
    queryKey: ['youtube', artist, song],
    queryFn: () => getYoutubeVideo(artist, song).then(res => res.data.videoId || ""),
    ...songCache,
  });
};

export const useSpotifyTrack = (artist, song, token) => {
  return useQuery({
    queryKey: ['spotify-track', artist, song, token],
    queryFn: () =>
      findTrackUri(token, artist, song).catch((err) => {
        if (err.status === 401) clearAccessToken(); // expired token
        throw err;
      }),
    enabled: !!token,
    ...songCache,
  });
};

export const useCitySearch = (query) => {
  return useQuery({
    queryKey: ['city-search', query],
    queryFn: () =>
      searchCities(query).then((res) =>
        res.data.features.map(({ properties: p, geometry }) => ({
          id: `${p.osm_type}${p.osm_id}`,
          city: p.name,
          state: p.state,
          country: p.country,
          countryCode: p.countrycode,
          lat: geometry.coordinates[1],
          lon: geometry.coordinates[0],
        }))
      ),
    enabled: query.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useSetlistById = (id) => {
  return useQuery({
    queryKey: ['setlist', id],
    queryFn: () => getSetlistById(id).then(res => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: false,
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
    staleTime: 0,
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