import CardTitle from "../ArtistPage/CardTitle";
import StarRating from "../ArtistPage/StarRating";
import VenueSource from "./VenueSource";

export default function VenueRating({ rating }) {
  return (
    <section
      aria-label="Venue ratings"
      className="flex min-w-0 flex-col gap-2 bg-white px-2 sm:px-4"
    >
      <CardTitle>Ratings</CardTitle>
      <div
        className="flex flex-1 flex-col items-center justify-center py-2"
        aria-label="Google rating"
      >
        {rating ? (
          <>
            <div className="flex w-full justify-center [&>div]:max-w-full [&>div]:flex-wrap [&>div]:justify-center [&_svg]:shrink-0">
              <StarRating value={rating.value} size="text-[2.53125rem]" />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-zinc-500">
              <span>{rating.value.toFixed(1)}</span>
              {rating.count != null && (
                <span>({rating.count.toLocaleString("en-US")} ratings)</span>
              )}
            </div>
            <VenueSource detail={rating} />
          </>
        ) : (
          <p className="text-center">N/A</p>
        )}
      </div>
    </section>
  );
}
