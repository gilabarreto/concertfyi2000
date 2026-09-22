import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import StarRating from "./StarRating";
import { upsertReview } from "../../helpers/concertReviews";

const MAX_COMMENT = 300;

// Two entry points into the same <dialog>: "I WAS THERE" opens at the rate step (rating
// is saved the moment "Next" is clicked, so it survives even if the comment step gets
// closed unanswered); the Review row's own "Leave a review" skips straight to the comment
// step and never touches the rating — that's what the stars in the list are for.
const ConcertRatingDialog = forwardRef(function ConcertRatingDialog({ concertId, onSaved }, ref) {
  const dialogRef = useRef(null);
  const [step, setStep] = useState("rate");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useImperativeHandle(ref, () => ({
    open(startStep = "rate") {
      setStep(startStep);
      dialogRef.current.showModal();
    },
  }));

  // Native <dialog> fires "close" for Esc too, not just our own buttons.
  const reset = () => {
    setStep("rate");
    setRating(0);
    setComment("");
  };

  const goToComment = () => {
    onSaved(upsertReview(concertId, { rating }));
    setStep("comment");
  };

  const saveComment = (withComment) => {
    if (withComment) onSaved(upsertReview(concertId, { comment: comment.trim() }));
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
              onClick={goToComment}
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
              onClick={() => saveComment(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded font-semibold text-gray-600 hover:border-red-600 hover:text-red-600"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => saveComment(true)}
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
});

export default ConcertRatingDialog;
