import Icon from "../Icon";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Map from "./Map";

// Same native <dialog> as Setlist's disclaimer (Esc closes it for free, no key handler
// needed) — but map-only: no heading, no footer button, just an X over the top corner.
// aria-label stands in for the visible title neither of them has anymore.
export default function MapDialog({ dialogRef, title, latitude, longitude }) {
  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      className="relative bg-white rounded-lg p-0 w-[calc(100%-2rem)] max-w-md overflow-hidden backdrop:bg-black/50"
    >
      <button
        type="button"
        onClick={() => dialogRef.current.close()}
        title="Close"
        aria-label="Close"
        className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:text-red-600"
      >
        <Icon icon={faXmark} />
      </button>
      <Map latitude={latitude} longitude={longitude} />
    </dialog>
  );
}
