// Ticketmaster is the only seller whose price we get from an API today, so it is
// the only row with a number. The resale sites open a search for the same show.
const resellers = [
  { name: "StubHub", url: (q) => `https://www.stubhub.com/secure/search?q=${q}` },
  { name: "Vivid Seats", url: (q) => `https://www.vividseats.com/search?searchTerm=${q}` },
  { name: "SeatGeek", url: (q) => `https://seatgeek.com/search?search=${q}` },
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
  const query = encodeURIComponent([artistName, city].filter(Boolean).join(" "));

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
            href={seller.url(query)}
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
