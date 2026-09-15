import { faBed } from "@fortawesome/free-solid-svg-icons";
import VendorTiles from "./VendorTiles";

// localDate is a plain "YYYY-MM-DD", so parsing it as UTC keeps the night of the show
// as check-in no matter where the visitor is.
const nextDay = (localDate) => {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

// None of these publish a nightly rate without an affiliate key, so every tile falls
// back to "Check price". The links do land on the right city and dates.
export default function HotelOptions({ event }) {
  const venue = event._embedded?.venues?.[0];
  const checkin = event.dates?.start?.localDate;

  // without a city or a date the search would open on the wrong place entirely
  if (!venue?.city?.name || !checkin) return null;

  const checkout = nextDay(checkin);
  const place = [venue.city.name, venue.state?.stateCode || venue.country?.countryCode]
    .filter(Boolean)
    .join(", ");
  const dest = encodeURIComponent(place);

  const vendors = [
    {
      name: "Booking.com",
      domain: "booking.com",
      href: `https://www.booking.com/searchresults.html?ss=${dest}&checkin=${checkin}&checkout=${checkout}`,
    },
    {
      name: "Expedia",
      domain: "expedia.com",
      href: `https://www.expedia.com/Hotel-Search?destination=${dest}&startDate=${checkin}&endDate=${checkout}`,
    },
    {
      name: "Hotels.com",
      domain: "hotels.com",
      href: `https://www.hotels.com/Hotel-Search?destination=${dest}&startDate=${checkin}&endDate=${checkout}`,
    },
    {
      name: "Airbnb",
      domain: "airbnb.com",
      href: `https://www.airbnb.com/s/${dest}/homes?checkin=${checkin}&checkout=${checkout}`,
    },
  ];

  return <VendorTiles icon={faBed} title="Book a hotel" vendors={vendors} />;
}
