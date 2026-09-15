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

      <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1 sm:gap-x-4">
        {vendors.map((vendor) => (
          <li key={vendor.name}>
            <a
              className="flex flex-col items-center gap-1 rounded px-3 py-2 w-24 hover:text-red-800 hover:bg-gray-100 sm:w-28"
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
              <span className="text-sm font-semibold">{vendor.price || "Check price"}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
