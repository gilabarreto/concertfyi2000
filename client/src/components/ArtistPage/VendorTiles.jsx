import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Shared panel for the seller and hotel rows inside an expanded concert: a centered
// heading, then one logo tile per vendor. Logos come from Google's favicon service,
// which hands back 32, 48 or 64px marks, so object-contain keeps them square.
export default function VendorTiles({ icon, title, vendors }) {
  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 sm:p-4">
      <h3 className="text-base font-semibold text-gray-700 mb-2 text-center">
        <FontAwesomeIcon icon={icon} className="text-sm text-red-600" aria-hidden="true" /> {title}
      </h3>

      {/* no wrapping: the tiles shrink so all three hotels stay on one row on a phone */}
      <ul className="flex justify-center gap-x-2 sm:gap-x-4">
        {vendors.map((vendor) => (
          <li key={vendor.name} className="min-w-0 flex-1 max-w-28">
            <a
              className="flex flex-col items-center gap-1 rounded px-1 py-2 hover:text-red-800 hover:bg-gray-100 sm:px-3"
              href={vendor.href}
              target="_blank"
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
              {/* every tile keeps a line here, so the row stays level */}
              <span className="text-sm font-semibold text-center">
                {vendor.price || "Check price"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
