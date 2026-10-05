import { faTicketSimple } from "@fortawesome/free-solid-svg-icons/faTicketSimple";
import VendorTiles from "./VendorTiles";

import { useT } from "../../i18n";
const term = (...parts) => encodeURIComponent(parts.filter(Boolean).join(" "));

const money = (amount, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

// Only sellers that land on the show itself. StubHub and Vivid Seats need their own
// event id to deep link, so they opened a search page and dropped out.
// Ticketmaster only publishes priceRanges for TicketWeb-ticketed shows; the rest of
// its inventory is dynamically priced and carries no range at all.
export default function TicketOptions({ event, artistName, iconOnly = false }) {
  const t = useT();
  const city = event._embedded?.venues?.[0]?.city?.name;
  const range = event.priceRanges?.find((item) => item.currency);

  const vendors = [
    {
      name: "Ticketmaster",
      domain: "ticketmaster.com",
      href: event.url,
      subtitle: range
        ? t("from {price}", { price: money(range.min, range.currency) })
        : t("Check price"),
    },
    {
      name: "SeatGeek",
      domain: "seatgeek.com",
      href: `https://seatgeek.com/search?search=${term(artistName, city)}`,
      subtitle: t("Check price"),
    },
  ];

  return (
    <VendorTiles
      icon={faTicketSimple}
      title={t("Get tickets")}
      vendors={vendors}
      iconOnly={iconOnly}
    />
  );
}
