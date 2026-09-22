import { useRef, useState } from "react";
import Icon from "../Icon";
import { faBackward, faForward } from "@fortawesome/free-solid-svg-icons";
import StarRating from "./StarRating";

const PREVIEW_LENGTH = 120;

// Nothing to show before the first "I WAS THERE" rating — LastConcert only mounts this
// once reviews exist, but bail here too since it's cheap insurance.
export default function ConcertComments({ reviews }) {
  const [index, setIndex] = useState(0);
  const expandRef = useRef(null);

  if (reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  // A rating with no comment still counts toward the average above, it just has nothing
  // to show for Review below — same backward/forward icons as the concert-date nav above.
  const withComments = reviews.filter((r) => r.comment);
  const current = withComments[Math.min(index, withComments.length - 1)];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span>Rating:&ensp;</span>
        <StarRating value={average} size="text-lg" />
        <span className="text-xs text-gray-500">
          {average.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
        </span>
      </div>

      {current && (
        <div className="flex items-center gap-2 text-sm">
          <span className="shrink-0">Review:&ensp;</span>
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
        </div>
      )}

      <dialog
        ref={expandRef}
        aria-label="Review"
        className="bg-white rounded-lg p-6 w-[calc(100%-2rem)] max-w-md backdrop:bg-black/50"
      >
        <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{current?.comment}</p>
        <button
          type="button"
          onClick={() => expandRef.current.close()}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-800 text-white font-semibold rounded"
        >
          Close
        </button>
      </dialog>
    </div>
  );
}
