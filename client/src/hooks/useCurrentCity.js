import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useGeolocation } from "./useGeolocation";

// The city picked in the location menu, or the browser's own (same order as the Home
// carousel). My City and the venues list both read it.
export function useCurrentCity() {
  const { selectedLocation } = useContext(AppContext);
  const geo = useGeolocation();
  return {
    city: selectedLocation?.city || geo.city,
    country: selectedLocation?.country || geo.country,
    countryCode: selectedLocation?.countryCode,
    lat: selectedLocation?.lat ?? geo.coords.lat,
    long: selectedLocation?.lon ?? geo.coords.long,
  };
}
