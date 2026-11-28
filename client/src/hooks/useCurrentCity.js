import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useGeolocation } from "./useGeolocation";
import { useSearchParams } from "react-router-dom";

// The city picked in the location menu, or the browser's own (the URL's first).
// The Home lists, its carousel and the venues list all read it.
export function useCurrentCity() {
  const { selectedLocation } = useContext(AppContext);
  const geo = useGeolocation();
  const [params] = useSearchParams();
  const urlCity = params.get("city");
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (
    urlCity &&
    params.has("lat") &&
    params.has("lon") &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Number.isFinite(lon) &&
    Math.abs(lon) <= 180
  ) {
    return {
      city: urlCity,
      country: params.get("country") || "",
      countryCode: params.get("countryCode") || undefined,
      lat,
      long: lon,
      isLoading: false,
    };
  }
  return {
    city: selectedLocation?.city || geo.city,
    country: selectedLocation?.country || geo.country,
    countryCode: selectedLocation?.countryCode,
    lat: selectedLocation?.lat ?? geo.coords.lat,
    long: selectedLocation?.lon ?? geo.coords.long,
    isLoading: !selectedLocation && geo.isLoading,
  };
}
