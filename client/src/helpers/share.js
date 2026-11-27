import { useEffect, useState } from "react";
import { getBestImage, isArtist } from "./selectors.js";

const normalized = (value) => value?.trim().toLocaleLowerCase();

export function getTicketmasterEventImage(events = [], artist, localDate, venueName) {
  const candidates = events.filter(
    (event) =>
      event.dates?.start?.localDate === localDate &&
      event._embedded?.attractions?.some((attraction) => isArtist(attraction, artist)),
  );
  const venueMatch = candidates.find(
    (event) => normalized(event._embedded?.venues?.[0]?.name) === normalized(venueName),
  );
  return getBestImage((venueMatch || candidates[0])?.images || []);
}

// Share a URL hosted by the API so social crawlers can read event-specific Open Graph
// metadata before a browser is redirected to the regular ConcertFYI artist page.
const SHARE_BASE = import.meta.env.VITE_API_BASE || "https://api.concertfyi.com";

// The short link (JSON → deflate → base64url, server/routes/share.js) needs an await, and
// iOS Safari drops navigator.share() called after one: the tap is no longer "fresh". So the
// link is built when the card renders, and the click handler shares it with no await first.
// Clicked before it's ready (or no CompressionStream): the longer query link, built in sync.
function queryLink({ target, title, description, image }) {
  const preview = new URL("/share", SHARE_BASE);
  preview.searchParams.set("target", target);
  preview.searchParams.set("title", title);
  preview.searchParams.set("description", description);
  if (image) preview.searchParams.set("image", image);
  return preview.href;
}

async function shortLink(payload) {
  const compressed = await new Response(
    new Blob([JSON.stringify(payload)]).stream().pipeThrough(new CompressionStream("deflate")),
  ).arrayBuffer();
  const bytes = new Uint8Array(compressed);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  const token = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return new URL(`/share/${token}`, SHARE_BASE).href;
}

// Returns share(): opens the share sheet, or copies the link and resolves true.
export function useShare(url, title, { text = "", imageUrl } = {}) {
  const description = `${text} Learn more at concertfyi.com.`;
  const payload = { target: url, title, description, image: imageUrl || "" };
  const [short, setShort] = useState(null);
  useEffect(() => {
    let live = true;
    setShort(null);
    if (typeof CompressionStream === "function")
      shortLink({ target: url, title, description, image: imageUrl || "" })
        .then((href) => live && setShort(href))
        .catch(() => {});
    return () => {
      live = false;
    };
  }, [url, title, description, imageUrl]);

  return async () => {
    const link = short || queryLink(payload);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: link });
        return false;
      }
      await navigator.clipboard.writeText(`${text}\n\nLearn more at concertfyi.com: ${link}`);
      return true;
    } catch {
      // Share cancellation or clipboard denial leaves the page unchanged.
      return false;
    }
  };
}
