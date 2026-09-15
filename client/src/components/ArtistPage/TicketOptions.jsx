const term = (...parts) => encodeURIComponent(parts.filter(Boolean).join(" "));

// Each search behaves differently: SeatGeek narrows to the single show when the
// city is in the query, while StubHub and Vivid Seats come back empty and need
// the artist alone. None of the three exposes a price without a partner API.
const resellers = [
  {
    name: "StubHub",
    url: (artist) => `https://www.stubhub.com/secure/search?q=${term(artist)}`,
  },
  {
    name: "Vivid Seats",
    url: (artist) => `https://www.vividseats.com/search?searchTerm=${term(artist)}`,
  },
  {
    name: "SeatGeek",
    url: (artist, city) => `https://seatgeek.com/search?search=${term(artist, city)}`,
  },
];

const money = (amount, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export default function TicketOptions({ event, artistName }) {
  const range = event.priceRanges?.find((item) => item.currency);
  const city = event._embedded?.venues?.[0]?.city?.name;

  const linkClass = "flex w-full items-center justify-between py-1 hover:text-red-800";

  return (
    <ul className="pb-2 pl-4 text-sm">
      <li>
        <a className={linkClass} href={event.url} target="_blank" rel="noopener noreferrer">
          <span>Ticketmaster</span>
          <span className="font-semibold">
            {range ? `from ${money(range.min, range.currency)}` : "Check price"}
          </span>
        </a>
      </li>
      {resellers.map((seller) => (
        <li key={seller.name}>
          <a
            className={`${linkClass} text-gray-600`}
            href={seller.url(artistName, city)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{seller.name}</span>
            <span>Check price</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
