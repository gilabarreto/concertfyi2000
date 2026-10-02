import VendorPopup from "./VendorPopup";
import Icon from "../Icon";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faMinus } from "@fortawesome/free-solid-svg-icons/faMinus";

// Collapsible options for tickets, hotels and calendars inside an expanded concert.
// Each section opens independently and starts collapsed. Logos come from Google's favicon service,
// which hands back 32, 48 or 64px marks, so object-contain keeps them square.
export default function VendorTiles({ icon, title, vendors, iconOnly = false }) {
  // one vendor with a second line means every tile reserves one, so the row stays level
  const hasSubtitle = vendors.some((vendor) => vendor.subtitle);

  if (iconOnly) {
    return <VendorPopup icon={icon} title={title} vendors={vendors} />;
  }

  return (
    <details className="group bg-zinc-50 border-b border-zinc-300/50 p-2 sm:p-4">
      <summary className="relative flex cursor-pointer list-none items-center justify-center text-base font-semibold text-zinc-700 hover:text-red-800 [&::-webkit-details-marker]:hidden">
        <span className="mx-auto grid w-44 max-w-[calc(100%-3rem)] grid-cols-[1rem_minmax(0,1fr)] items-center gap-2 text-left">
          <Icon icon={icon} className="justify-self-center text-sm text-red-600" />
          {title}
        </span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-red-600">
          <Icon icon={faPlus} className="group-open:hidden" />
          <Icon icon={faMinus} className="hidden group-open:inline-block" />
        </span>
      </summary>

      {/* no wrapping: the tiles shrink so all three hotels stay on one row on a phone */}
      <ul className="mt-2 flex justify-center gap-x-2 sm:gap-x-4">
        {vendors.map((vendor) => (
          <li key={vendor.name} className="min-w-0 flex-1 max-w-28">
            <a
              className="flex flex-col items-center gap-1 rounded px-1 py-2 hover:text-red-800 hover:bg-zinc-100 sm:px-3"
              href={vendor.href}
              download={vendor.download}
              target={vendor.download ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${vendor.domain}&sz=64`}
                alt=""
                className="h-8 w-8 object-contain"
                width="32"
                height="32"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              <span className="text-sm text-center">{vendor.name}</span>
              {hasSubtitle && (
                <span className="text-sm font-semibold text-center">{vendor.subtitle || " "}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
