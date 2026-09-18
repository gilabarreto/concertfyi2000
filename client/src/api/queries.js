import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getSetlist,
  getSetlistById,
  getLocalEvents,
  getTicketmaster,
  searchCities,
  getLyrics,
  getYoutubeVideo,
  getArtistBackground,
} from "./api";
import { findTrackUri } from "../helpers/spotifyPlaylist";
import { clearAccessToken } from "../helpers/spotifyAuth";
import { formatArtistBackground } from "../helpers/selectors";

// Song details don't change: cache for the session instead of the 1s global gcTime,
// so reopening a song is instant (and saves YouTube API quota). "Not found" is a normal answer, no retry.
const songCache = { staleTime: Infinity, gcTime: 30 * 60 * 1000, retry: false };

export const useLyrics = (artist, song) => {
  return useQuery({
    queryKey: ["lyrics", artist, song],
    queryFn: () => getLyrics(artist, song).then((res) => res.lyrics || ""),
    ...songCache,
  });
};

export const useYoutubeVideo = (artist, song) => {
  return useQuery({
    queryKey: ["youtube", artist, song],
    queryFn: () => getYoutubeVideo(artist, song).then((res) => res.videoId || ""),
    ...songCache,
  });
};

export const useSpotifyTrack = (artist, song, token) => {
  return useQuery({
    queryKey: ["spotify-track", artist, song, token],
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
    queryKey: ["city-search", query],
    queryFn: () =>
      searchCities(query).then((res) =>
        res.features.map(({ properties: p, geometry }) => ({
          id: `${p.osm_type}${p.osm_id}`,
          city: p.name,
          state: p.state,
          country: p.country,
          countryCode: p.countrycode,
          lat: geometry.coordinates[1],
          lon: geometry.coordinates[0],
        })),
      ),
    enabled: query.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useSetlistById = (id) => {
  return useQuery({
    queryKey: ["setlist", id],
    queryFn: () => getSetlistById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
};

export const useSetlistSearch = (artistName) => {
  return useQuery({
    queryKey: ["setlist-search", artistName],
    queryFn: () => getSetlist(artistName),
    enabled: !!artistName,
    staleTime: 10 * 60 * 1000,
  });
};

export const useLocalEvents = (lat, long) => {
  return useQuery({
    queryKey: ["local-events", lat, long],
    queryFn: () => getLocalEvents(lat, long),
    enabled: !!lat && !!long,
    staleTime: 5 * 60 * 1000,
  });
};

// mbid é o :artistId da URL. Biografia não muda dentro de uma sessão — mesmo preset
// de cache que letra/vídeo, e 404 (artista sem entrada no MusicBrainz) não tenta de novo.
export const useArtistBackground = (mbid) => {
  return useQuery({
    queryKey: ["artist-background", mbid],
    queryFn: () => getArtistBackground(mbid).then(formatArtistBackground),
    enabled: !!mbid,
    ...songCache,
  });
};

export const useTicketmasterSearch = (artistName) => {
  return useQuery({
    queryKey: ["ticketmaster-search", artistName],
    queryFn: () => getTicketmaster(artistName),
    enabled: !!artistName,
    staleTime: 0,
  });
};

export const useArtistData = (artistName) => {
  return useQuery({
    queryKey: ["artist-data", artistName],
    // As duas APIs se juntam pelo nome do artista e nenhuma delas é obrigatória: a página
    // existe só com o setlist, e existe só com o Ticketmaster. Por isso cada uma engole o
    // próprio erro e devolve vazio — o Promise.all aqui nunca rejeita.
    queryFn: async () => {
      const [setlistRes, ticketmasterRes] = await Promise.all([
        getSetlist(artistName).catch((err) => {
          console.error("Erro no setlist:", err);
          return { setlist: [] };
        }),
        getTicketmaster(artistName).catch((err) => {
          console.error("Erro no ticketmaster:", err);
          return { _embedded: {} };
        }),
      ]);

      return {
        setlist: setlistRes?.setlist || [],
        ticketmaster: ticketmasterRes?._embedded || {},
      };
    },
    enabled: !!artistName,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
};
