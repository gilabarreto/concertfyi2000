import { useEffect, useRef, useState } from "react";
import CardTitle from "../ArtistPage/CardTitle";

const safeUrl = (value) => (/^https?:\/\//i.test(value || "") ? value : undefined);
const PREVIEW_LINES = 5;

// Reviews arrive with the venue's services payload: one billed Google call carries both.
export default function VenueReviewSummary({ reviews = [], url, loading }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const current = reviews[Math.min(index, Math.max(0, reviews.length - 1))];
  const textRef = useRef(null);
  const [hasMore, setHasMore] = useState(false);
  const [lineHeight, setLineHeight] = useState(24);
  useEffect(() => {
    const element = textRef.current;
    if (!element) {
      setHasMore(false);
      return;
    }
    const measure = () => {
      const measuredLineHeight = parseFloat(getComputedStyle(element).lineHeight);
      setLineHeight(measuredLineHeight);
      setHasMore(element.scrollHeight > measuredLineHeight * PREVIEW_LINES + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [current?.text]);
  const mask =
    hasMore && !expanded
      ? `linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${lineHeight * PREVIEW_LINES}px, rgba(0,0,0,0) ${lineHeight * (PREVIEW_LINES + 1)}px)`
      : undefined;
  const step = (delta) => {
    setIndex((index + delta + reviews.length) % reviews.length);
    setExpanded(false);
  };
  return (
    <section aria-label="Venue reviews" className="min-w-0 bg-white px-2 sm:px-4 space-y-2">
      <CardTitle>Reviews</CardTitle>
      <div className="space-y-2 py-2">
        {loading ? (
          <span role="status">Loading…</span>
        ) : current ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {reviews.length > 1 && (
              <button
                type="button"
                aria-label="Previous venue review"
                onClick={() => step(-1)}
                className="flex w-6 shrink-0 items-center justify-center text-[5.25rem] font-light leading-none text-red-600"
              >
                {"{"}
              </button>
            )}
            <p
              ref={textRef}
              id="venue-review-text"
              className="min-w-0 flex-1 ml-3 overflow-hidden break-words whitespace-pre-line text-base leading-relaxed text-zinc-700"
              style={{
                maxHeight: hasMore && !expanded ? lineHeight * (PREVIEW_LINES + 1) : undefined,
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
            >
              {current.text}
            </p>
            {reviews.length > 1 && (
              <button
                type="button"
                aria-label="Next venue review"
                onClick={() => step(1)}
                className="flex w-6 shrink-0 items-center justify-center text-[5.25rem] font-light leading-none text-red-600"
              >
                {"}"}
              </button>
            )}
          </div>
        ) : (
          "No reviews available for this venue yet. Check back later."
        )}
      </div>
      {hasMore && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            className="font-semibold text-base text-red-600 hover:text-red-800"
            aria-expanded={expanded}
            aria-controls="venue-review-text"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        </div>
      )}
      {current && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          <a
            href={safeUrl(current.authorUrl)}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-red-600"
          >
            {current.author}
          </a>{" "}
          · {current.rating}/5 · {current.published} ·{" "}
          <a
            href={safeUrl(current.url || url)}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-red-600"
          >
            <span translate="no">Google Maps</span>
          </a>
        </p>
      )}
    </section>
  );
}
