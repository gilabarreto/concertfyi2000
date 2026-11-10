import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

import { useT } from "../../i18n";
const mapsOptions = { googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY };

// Takes raw coordinates instead of a concert: Last Concert (setlist.fm, coords under
// venue.city.coords) and Next Concert (Ticketmaster, coords under venue.location) don't
// share a shape, so each caller pulls its own pair out and this stays pure display.
// Maps Embed and not the JS map: one pin needs no interaction, and Embed is free with no
// cap, while every JS map load spends the 10,000-a-month free tier shared with TourMap.
export default function Map({ latitude, longitude }) {
  const t = useT();
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (!lat || !lng) return null;

  const src = `https://www.google.com/maps/embed/v1/place?key=${mapsOptions.googleMapsApiKey}&q=${lat},${lng}&zoom=12`;
  return (
    <iframe
      title={t("Map")}
      src={src}
      className="w-full h-full border-0"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

// Tour Statistics: many points instead of one. Past shows are solid red, upcoming ones
// hollow, and the map frames all of them instead of a fixed zoom.
export function TourMap({ points, onSelect }) {
  const t = useT();
  const { isLoaded } = useLoadScript(mapsOptions);

  if (!points.length) return null;
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">{t("Loading…")}</div>;
  }

  const fit = (map) => {
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 32);
    // One show (or one city) would otherwise zoom to street level.
    if (points.length === 1) map.setZoom(10);
  };

  return (
    <GoogleMap
      key={points.length}
      onLoad={fit}
      mapContainerClassName="w-full h-full"
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {points.map((point, i) => (
        <MarkerF
          key={i}
          position={point}
          title={point.label}
          onClick={onSelect ? () => onSelect(point) : undefined}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#DC2626",
            fillOpacity: point.upcoming ? 0 : 1,
            strokeColor: "#DC2626",
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
}
