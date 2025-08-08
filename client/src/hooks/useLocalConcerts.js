// src/hooks/useLocalConcerts.js
import { useQuery } from "@tanstack/react-query";
import { getLocalEvents } from "../api/api";

export function useLocalConcerts({ lat, long }, enabled = true) {
  return useQuery({
    queryKey: ["localConcerts", lat, long],
    queryFn: () => getLocalEvents(lat, long).then((res) => res.data),
    enabled: enabled && !!lat && !!long,
    staleTime: 1000 * 60 * 5,
  });
}
