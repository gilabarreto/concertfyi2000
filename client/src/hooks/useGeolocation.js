import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getReverseGeocode } from "../api/api";

const fetchCity = async (lat, long) => {
  const data = await getReverseGeocode(lat, long);
  return { city: data.city || "Unknown", country: data.country || "Unknown" };
};

export const useGeolocation = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["geolocation"],
    queryFn: async () => {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { city, country } = await fetchCity(
        position.coords.latitude,
        position.coords.longitude,
      );

      return {
        coords: {
          lat: position.coords.latitude,
          long: position.coords.longitude,
        },
        city,
        country,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    retry: 1,
    initialData: () => {
      const cached = localStorage.getItem("geolocationCache");
      return cached ? JSON.parse(cached) : undefined;
    },
  });

  useEffect(() => {
    if (data) {
      localStorage.setItem("geolocationCache", JSON.stringify(data));
    }
  }, [data]);

  return {
    coords: data?.coords || { lat: 49.2827, long: -123.1207 },
    city: data?.city || "Vancouver",
    country: data?.country || "Canada",
    isLoading,
    error,
  };
};
