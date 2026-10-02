import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getSetlist,
  getSetlistById,
  getArtistSetlists,
  getTourSetlists,
  getVenueSetlists,
  getVenueEvents,
  getCitySetlists,
  getRecentSetlists,
  getLocalEvents,
  getTicketmaster,
  searchCities,
  getLyrics,
  getYoutubeVideo,
  getArtistBackground,
  getArtistImages,
  getArtistAlbums,
} from "./api";
import { findTrackUri } from "../helpers/spotifyPlaylist";
import { clearAccessToken } from "../helpers/spotifyAuth";

export const useArtistImages = (mbid) =>
  useQuery({
    queryKey: ["artist-images", mbid],
    queryFn: () => getArtistImages(mbid),
    enabled: !!mbid,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: false,
  });

// Discografia muda uma vez por ano; o servidor segura 24 h e aqui também.
export const useArtistAlbums = (mbid) =>
  useQuery({
    queryKey: ["artist-albums", mbid],
    queryFn: () => getArtistAlbums(mbid),
    enabled: !!mbid,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: false,
  });

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

// Search by name is for finding artists; once the page knows the mbid, this is the exact list.
export const useArtistSetlists = (mbid) => {
  return useQuery({
    queryKey: ["artist-setlists", mbid],
    queryFn: () => getArtistSetlists(mbid),
    enabled: !!mbid,
    staleTime: 10 * 60 * 1000,
  });
};

// A tour's past only grows by a show every few days, and the route spends up to 5 calls.
export const useTourSetlists = (artistMbid, tourName) => {
  return useQuery({
    queryKey: ["tour-setlists", artistMbid, tourName],
    queryFn: () => getTourSetlists(artistMbid, tourName),
    enabled: !!artistMbid && !!tourName,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

// Venue page: up to 3 setlist.fm calls, so hold it like the tour.
export const useVenueSetlists = (venueId) => {
  return useQuery({
    queryKey: ["venue-setlists", venueId],
    queryFn: () => getVenueSetlists(venueId),
    enabled: !!venueId,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

export const useVenueEvents = (name, lat, long) => {
  return useQuery({
    queryKey: ["venue-events", name, lat, long],
    queryFn: () => getVenueEvents(name, lat, long),
    enabled: !!name && lat != null && long != null,
    staleTime: 10 * 60 * 1000,
  });
};

// My City page: up to 3 setlist.fm calls, held like the tour and the venue.
export const useCitySetlists = (cityName, countryCode, year) => {
  return useQuery({
    queryKey: ["city-setlists", cityName, countryCode, year],
    queryFn: () => getCitySetlists(cityName, countryCode, year),
    enabled: !!cityName,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

// The server already holds this for 30 min; same here so Home doesn't ask again on every visit.
export const useRecentSetlists = () => {
  return useQuery({
    queryKey: ["recent-setlists"],
    queryFn: getRecentSetlists,
    staleTime: 30 * 60 * 1000,
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

// Keep Wikipedia summaries cached while navigating between concerts of the same artist.
export const useArtistBackground = (artist) => {
  return useQuery({
    queryKey: ["artist-wikipedia", artist],
    queryFn: () => getArtistBackground(artist),
    enabled: !!artist,
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
