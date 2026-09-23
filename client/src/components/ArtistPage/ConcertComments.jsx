import { useRef, useState } from "react";
import Icon from "../Icon";
import { faBackward, faForward } from "@fortawesome/free-solid-svg-icons";
import StarRating from "./StarRating";
import { upsertReview } from "../../helpers/concertReviews";

const PREVIEW_LENGTH = 120;

// Two more <li>s appended to LastConcert's own <ol> — same border-b/py-2 as Concert
// date/Tour/Venue/Location, so Rating and Review get the same separator and type size
// as the rest of that list instead of a mismatched block bolted on below it.
export default function ConcertComments({ concertId, reviews, onSaved, onLeaveReview }) {
  const [index, setIndex] = useState(0);
  const expandRef = useRef(null);

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  // A rating with no comment still counts toward the average above, it just has nothing
  // to show for Review below — same backward/forward icons as the concert-date nav above.
  const withComments = reviews.filter((r) => r.comment);
  const current = withComments[Math.min(index, Math.max(withComments.length - 1, 0))];

  return (
    <>
      <li className="border-b border-zinc-300/50 py-2">
        <div className="flex items-center gap-2">
          {/* Clicking here edits the rating directly — no need to reopen the popup just
              because someone changed their mind about the stars. */}
          <span>Rating:&ensp;</span>
          <StarRating
            value={average}
            onRate={(n) => onSaved(upsertReview(concertId, { rating: n }))}
            size="text-lg"
          />
          <span className="text-xs text-zinc-500">
            {reviews.length > 0
              ? `${average.toFixed(1)} (${reviews.length} ${reviews.length === 1 ? "review" : "reviews"})`
              : "(no ratings yet)"}
          </span>
        </div>
      </li>

      <li className="border-b border-zinc-300/50 py-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0">Review:&ensp;</span>
          {current ? (
            <>
              {withComments.length > 1 && (
                <Icon
                  icon={faBackward}
                  className="text-xs text-red-600 cursor-pointer shrink-0"
                  onClick={() => setIndex((index - 1 + withComments.length) % withComments.length)}
                />
              )}
              <p className="flex-1">
                {current.comment.length > PREVIEW_LENGTH ? (
                  <>
                    {current.comment.slice(0, PREVIEW_LENGTH)}…{" "}
                    <button
                      type="button"
                      onClick={() => expandRef.current.showModal()}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Read more
                    </button>
                  </>
                ) : (
                  current.comment
                )}
              </p>
              {withComments.length > 1 && (
                <Icon
                  icon={faForward}
                  className="text-xs text-red-600 cursor-pointer shrink-0"
                  onClick={() => setIndex((index + 1) % withComments.length)}
                />
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onLeaveReview}
              className="text-red-600 hover:text-red-800 font-semibold"
            >
              (Leave a review)
            </button>
          )}
        </div>
      </li>

      <dialog
        ref={expandRef}
        aria-label="Review"
        className="bg-white rounded-lg p-6 w-[calc(100%-2rem)] max-w-md backdrop:bg-black/50"
      >
        <p className="text-sm text-zinc-700 mb-4 whitespace-pre-wrap">{current?.comment}</p>
        <button
          type="button"
          onClick={() => expandRef.current.close()}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-800 text-white font-semibold rounded"
        >
          Close
        </button>
      </dialog>
    </>
  );
}
