import { getBestImage } from "./selectors.js";

const normalized = (value) => value?.trim().toLocaleLowerCase();

export function getTicketmasterEventImage(events = [], artistName, localDate, venueName) {
  const candidates = events.filter(
    (event) =>
      event.dates?.start?.localDate === localDate &&
      event._embedded?.attractions?.some((attraction) => attraction.name === artistName),
  );
  const venueMatch = candidates.find(
    (event) => normalized(event._embedded?.venues?.[0]?.name) === normalized(venueName),
  );
  return getBestImage((venueMatch || candidates[0])?.images || []);
}

// Share a URL hosted by the API so social crawlers can read event-specific Open Graph
// metadata before a browser is redirected to the regular ConcertFYI artist page.
const SHARE_BASE = import.meta.env.VITE_API_BASE || "https://concertfyi2000.onrender.com";

export async function shareOrCopy(url, title = document.title, { text = "", imageUrl } = {}) {
  const description = `${text} Learn more at concertfyi.com.`;
  const preview = new URL("/share", SHARE_BASE);
  preview.searchParams.set("target", url);
  preview.searchParams.set("title", title);
  preview.searchParams.set("description", description);
  if (imageUrl) preview.searchParams.set("image", imageUrl);

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url: preview.href });
      return false;
    }

    await navigator.clipboard.writeText(`${text}\n\nLearn more at concertfyi.com: ${preview.href}`);
    return true;
  } catch {
    // Share cancellation or clipboard denial leaves the page unchanged.
    return false;
  }
}
