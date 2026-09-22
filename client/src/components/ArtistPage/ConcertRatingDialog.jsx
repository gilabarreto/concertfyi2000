import { useState } from "react";
import StarRating from "./StarRating";
import { addReview } from "../../helpers/concertReviews";

const MAX_COMMENT = 300;

// Two steps in one <dialog>: rate first, then — only once a rating exists — offer to
// comment. "Not now" and "Skip" both still count as answering; a rating alone is a
// complete review, the comment step never blocks it.
export default function ConcertRatingDialog({ dialogRef, concertId, onSaved }) {
  const [step, setStep] = useState("rate");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Native <dialog> fires "close" for Esc too, not just our own buttons — reset there so
  // reopening it later (a second "I WAS THERE") always starts from the rating step.
  const reset = () => {
    setStep("rate");
    setRating(0);
    setComment("");
  };

  const save = (withComment) => {
    onSaved(addReview(concertId, { rating, comment: withComment ? comment.trim() : "" }));
    dialogRef.current.close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={reset}
      aria-labelledby="rating-title"
      className="bg-white rounded-lg p-8 w-[calc(100%-2rem)] max-w-md backdrop:bg-black/50"
    >
      {step === "rate" ? (
        <>
          <h3 id="rating-title" className="text-xl font-bold mb-4 text-center">
            Rate this concert
          </h3>
          <div className="flex justify-center py-4">
            <StarRating value={rating} onRate={setRating} size="text-4xl" />
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={() => dialogRef.current.close()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded font-semibold text-gray-600 hover:border-red-600 hover:text-red-600"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => setStep("comment")}
              disabled={!rating}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-800 disabled:opacity-50 text-white font-semibold rounded"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 id="rating-title" className="text-xl font-bold mb-4 text-center">
            Want to add a comment?
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            rows={4}
            placeholder="Share your thoughts about this concert…"
            className="w-full border border-gray-300 rounded p-2 text-sm resize-none"
          />
          <div className="text-xs text-gray-400 text-right mb-4">
            {comment.length}/{MAX_COMMENT}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded font-semibold text-gray-600 hover:border-red-600 hover:text-red-600"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={!comment.trim()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-800 disabled:opacity-50 text-white font-semibold rounded"
            >
              Post
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
