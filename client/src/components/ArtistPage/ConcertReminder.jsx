import { faCalendarPlus } from "@fortawesome/free-solid-svg-icons";
import VendorTiles from "./VendorTiles";
import { googleCalendarUrl, outlookCalendarUrl, concertIcsUrl } from "../../helpers/calendar";

// Apple publishes no template URL, so its tile hands over the .ics file — the same
// file any other calendar app imports, which is why it names it on the second line.
export default function ConcertReminder({ event, artistName }) {
  const google = googleCalendarUrl(event, artistName);

  // no date: every one of these would land on the wrong day
  if (!google) return null;

  const vendors = [
    {
      name: "Google Calendar",
      domain: "calendar.google.com",
      href: google,
    },
    {
      name: "Apple Calendar",
      domain: "apple.com",
      href: concertIcsUrl(event, artistName),
      download: `${artistName} concert.ics`,
      subtitle: ".ics file",
    },
    {
      name: "Outlook",
      domain: "outlook.com",
      href: outlookCalendarUrl(event, artistName),
    },
  ];

  return <VendorTiles icon={faCalendarPlus} title="Add to calendar" vendors={vendors} />;
}
