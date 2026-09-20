import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

export default function Map({ concert }) {
  // O hook vem antes do guard: um concert sem coords seguido de um com coords
  // mudaria a quantidade de hooks entre renders e derruba o componente.
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const coords = concert?.venue?.city?.coords;
  if (!coords) return null;

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-64">Loading…</div>;
  }

  return <ArtistMap latitude={coords.lat} longitude={coords.long} />;
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
