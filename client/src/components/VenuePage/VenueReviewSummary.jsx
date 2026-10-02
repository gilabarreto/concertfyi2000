import { useState } from "react";
import { useVenueReviews } from "../../api/queries";

const safeUrl = (value) => (/^https?:\/\//i.test(value || "") ? value : undefined);
const PREVIEW_LENGTH = 120;

export default function VenueReviewSummary({ identity, enabled }) {
  const { data, isLoading, isError, refetch } = useVenueReviews(identity, enabled);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const reviews = data?.reviews || [];
  const current = reviews[Math.min(index, Math.max(0, reviews.length - 1))];
  const hasMore = current?.text.length > PREVIEW_LENGTH;
  const mask =
    hasMore && !expanded
      ? "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)"
      : undefined;
  const step = (delta) => {
    setIndex((index + delta + reviews.length) % reviews.length);
    setExpanded(false);
  };
  return (
    <li className="py-2">
      <div className="space-y-2">
        <p className="font-semibold">Reviews:</p>
        {isLoading ? (
          <span role="status">Loading…</span>
        ) : isError || data?.status === "unavailable" ? (
          <button type="button" onClick={() => refetch()} className="text-red-600">
            Try again
          </button>
        ) : current ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {reviews.length > 1 && (
              <button
                type="button"
                aria-label="Previous venue review"
                onClick={() => step(-1)}
                className="flex w-6 shrink-0 items-center justify-center text-[3.5rem] font-light leading-none text-red-600"
              >
                {"{"}
              </button>
            )}
            <p
              id="venue-review-text"
              className="min-w-0 flex-1 ml-3 break-words whitespace-pre-line text-base leading-relaxed text-zinc-700"
              style={{ maskImage: mask, WebkitMaskImage: mask }}
            >
              {hasMore && !expanded
                ? `${current.text.slice(0, PREVIEW_LENGTH).replace(/\s+\S*$/, "")}…`
                : current.text}
            </p>
            {reviews.length > 1 && (
              <button
                type="button"
                aria-label="Next venue review"
                onClick={() => step(1)}
                className="flex w-6 shrink-0 items-center justify-center text-[3.5rem] font-light leading-none text-red-600"
              >
                {"}"}
              </button>
            )}
          </div>
        ) : (
          "N/A"
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
            href={safeUrl(current.url || data.url)}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-red-600"
          >
            <span translate="no">Google Maps</span>
          </a>
        </p>
      )}
    </li>
  );
}
