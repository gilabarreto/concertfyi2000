import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple } from "@fortawesome/free-solid-svg-icons";

const term = (...parts) => encodeURIComponent(parts.filter(Boolean).join(" "));

const money = (amount, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

// Ticketmaster is the only one with a real event URL, and the only one that could
// carry a price. The resale searches differ: SeatGeek narrows to the single show
// when the city is in the query, StubHub and Vivid Seats come back empty with it.
const sellers = [
  {
    name: "Ticketmaster",
    domain: "ticketmaster.com",
    url: (event) => event.url,
    price: (event) => {
      const range = event.priceRanges?.find((item) => item.currency);
      return range ? `from ${money(range.min, range.currency)}` : null;
    },
  },
  {
    name: "SeatGeek",
    domain: "seatgeek.com",
    url: (event, artist, city) => `https://seatgeek.com/search?search=${term(artist, city)}`,
  },
  {
    name: "StubHub",
    domain: "stubhub.com",
    url: (event, artist) => `https://www.stubhub.com/secure/search?q=${term(artist)}`,
  },
  {
    name: "Vivid Seats",
    domain: "vividseats.com",
    url: (event, artist) => `https://www.vividseats.com/search?searchTerm=${term(artist)}`,
  },
];

export default function TicketOptions({ event, artistName }) {
  const city = event._embedded?.venues?.[0]?.city?.name;

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 sm:p-4">
      <h3 className="text-base font-semibold text-gray-700 mb-2 text-center">
        <FontAwesomeIcon icon={faTicketSimple} className="text-sm text-red-600" aria-hidden="true" />{" "}
        Where to buy
      </h3>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {sellers.map((seller) => {
          const price = seller.price?.(event);

          return (
            <li key={seller.name}>
              <a
                className="flex flex-col items-center gap-1 rounded p-2 hover:text-red-800 hover:bg-gray-100"
                href={seller.url(event, artistName, city)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* the service hands back 32, 48 or 64px marks; object-contain keeps them square */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${seller.domain}&sz=64`}
                  alt=""
                  className="h-8 w-8 object-contain"
                  width="32"
                  height="32"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span className="text-sm text-center">{seller.name}</span>
                {price && <span className="text-sm font-semibold">{price}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
