import Icon from "../Icon";
import { faStar as faStarFull, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarEmpty } from "@fortawesome/free-regular-svg-icons";

// Read-only (no onRate) for display; interactive for the rating dialog. One button per
// star, not a left/right split — a split needs pixel-precise aim for the half; clicking
// the same star repeatedly cycles full → half → empty instead.
export default function StarRating({ value, onRate, size = "text-2xl" }) {
  return (
    <div
      className={`flex gap-1 ${size} text-yellow-400`}
      role={onRate ? "radiogroup" : "img"}
      aria-label={onRate ? "Rate this concert" : `Rated ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = value >= n ? faStarFull : value >= n - 0.5 ? faStarHalfStroke : faStarEmpty;
        if (!onRate) return <Icon key={n} icon={icon} />;
        const next = value === n ? n - 0.5 : value === n - 0.5 ? 0 : n;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} stars`}
            onClick={() => onRate(next)}
            className="leading-none"
          >
            <Icon icon={icon} />
          </button>
        );
      })}
    </div>
  );
}
