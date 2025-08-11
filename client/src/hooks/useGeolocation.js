import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

const fetchCity = async (lat, long) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`
  );
  const data = await response.json();
  return data.address.city || data.address.town || data.address.village || 'Unknown';
};

export const useGeolocation = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['geolocation'],
    queryFn: async () => {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      const city = await fetchCity(position.coords.latitude, position.coords.longitude);
      
      return {
        coords: {
          lat: position.coords.latitude,
          long: position.coords.longitude
        },
        city
      };
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
    cacheTime: 1000 * 60 * 60 * 24, // 24 horas
    retry: 1,
    initialData: () => {
      const cached = localStorage.getItem('geolocationCache');
      return cached ? JSON.parse(cached) : undefined;
    }
  });

  useEffect(() => {
    if (data) {
      localStorage.setItem('geolocationCache', JSON.stringify(data));
    }
  }, [data]);

  return {
    coords: data?.coords,
    city: data?.city,
    isLoading,
    error
  };
};