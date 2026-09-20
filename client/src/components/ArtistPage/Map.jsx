import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

// Takes raw coordinates instead of a concert: Last Concert (setlist.fm, coords under
// venue.city.coords) and Next Concert (Ticketmaster, coords under venue.location) don't
// share a shape, so each caller pulls its own pair out and this stays pure display.
export default function Map({ latitude, longitude }) {
  // O hook vem antes do guard: coords ausentes num render seguidas de coords presentes
  // no próximo mudaria a quantidade de hooks entre renders e derruba o componente.
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  if (!latitude || !longitude) return null;

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-64">Loading…</div>;
  }

  return <ArtistMap latitude={latitude} longitude={longitude} />;
}

function ArtistMap({ latitude, longitude }) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  return (
    <GoogleMap
      zoom={12}
      center={{ lat, lng }}
      mapContainerClassName="w-full h-64 rounded-xl shadow"
    >
      <MarkerF position={{ lat, lng }} />
    </GoogleMap>
  );
}
