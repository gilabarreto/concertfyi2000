import { useEffect, useRef, useState } from "react";
import { faCalendarPlus, faShareNodes, faCheck } from "@fortawesome/free-solid-svg-icons";
import Icon from "../Icon";
import VendorTiles from "./VendorTiles";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  concertIcsUrl,
  details,
} from "../../helpers/calendar";

// Apple publishes no template URL, so its tile hands over the .ics file — the same
// file any other calendar app imports, which is why it names it on the second line.
export default function ConcertReminder({ event, artistName }) {
  const google = googleCalendarUrl(event, artistName);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

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

  const handleShare = async () => {
    const show = details(event, artistName);
    // Not show.url (the Ticketmaster page): this row is expanded, which already put
    // ?next=event.id on our own URL (see ConcertList's onSelect) — sharing the address
    // bar as-is lands the recipient on this artist's page with this date already picked.
    const shareData = { title: show.title, text: show.place, url: window.location.href };

    // Web Share API opens the OS sheet on mobile/supported browsers; everywhere else
    // (most desktop browsers) there's no share sheet, so the fallback copies the same
    // three lines a recipient would need, same idea as the "Copy setlist" button.
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet — nothing to recover from here
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(
        [show.title, show.place, shareData.url].filter(Boolean).join("\n"),
      );
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (no permission, insecure context) — nothing to recover from here
    }
  };

  return (
    <>
      <VendorTiles icon={faCalendarPlus} title="Add to calendar" vendors={vendors} />
      <div className="flex justify-center px-2 py-3 sm:px-4">
        {/* Same visual weight as "Create Spotify Playlist" below the setlist — both are
            the one committing action on their card, everything else on this row is a link. */}
        <button
          type="button"
          onClick={handleShare}
          title="Share"
          className="w-full px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-700 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Icon icon={copied ? faCheck : faShareNodes} />
          {copied ? "Link copied" : "Share"}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "Concert details copied to clipboard" : ""}
        </span>
      </div>
    </>
  );
}
