import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

const mapsOptions = { googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY };

// Takes raw coordinates instead of a concert: Last Concert (setlist.fm, coords under
// venue.city.coords) and Next Concert (Ticketmaster, coords under venue.location) don't
// share a shape, so each caller pulls its own pair out and this stays pure display.
export default function Map({ latitude, longitude }) {
  // O hook vem antes do guard: coords ausentes num render seguidas de coords presentes
  // no próximo mudaria a quantidade de hooks entre renders e derruba o componente.
  const { isLoaded } = useLoadScript(mapsOptions);

  if (!latitude || !longitude) return null;

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading…</div>;
  }

  return <ArtistMap latitude={latitude} longitude={longitude} />;
}

function ArtistMap({ latitude, longitude }) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  return (
    <GoogleMap zoom={12} center={{ lat, lng }} mapContainerClassName="w-full h-full">
      <MarkerF position={{ lat, lng }} />
    </GoogleMap>
  );
}

// Tour Statistics: many points instead of one. Past shows are solid red, upcoming ones
// hollow, and the map frames all of them instead of a fixed zoom.
export function TourMap({ points, onSelect }) {
  const { isLoaded } = useLoadScript(mapsOptions);

  if (!points.length) return null;
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading…</div>;
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
