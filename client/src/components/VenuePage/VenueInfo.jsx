import { useState } from "react";
import CardTitle from "../ArtistPage/CardTitle";
import VenueSource from "./VenueSource";
import Icon from "../Icon";
import { faGlobe } from "@fortawesome/free-solid-svg-icons/faGlobe";
import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons/faHeart";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons/faHeart";

import { useT } from "../../i18n";
const safeUrl = (value) => (/^https?:\/\//i.test(value || "") ? value : undefined);
const FAVORITE_VENUES_KEY = "favoriteVenueIds";
const getFavoriteVenues = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITE_VENUES_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export default function VenueInfo({ venue, ticketmaster, info = {}, services = {}, loading }) {
  const t = useT();
  // Missing only once every source has answered; until then the row is still on its way.
  // One full sentence per field: word order differs by language, so they can't be assembled.
  const missing = {
    description: t("No description available for this venue yet. Check back later."),
    city: t("No city available for this venue yet. Check back later."),
    address: t("No address available for this venue yet. Check back later."),
    phone: t("No phone number available for this venue yet. Check back later."),
    website: t("No website available for this venue yet. Check back later."),
  };
  const empty = (field) => (loading ? t("Loading…") : missing[field]);
  const [expanded, setExpanded] = useState(false);
  const [favoriteVenues, setFavoriteVenues] = useState(getFavoriteVenues);
  const isFavorite = favoriteVenues.includes(venue.id);
  const toggleFavorite = () => {
    const next = isFavorite
      ? favoriteVenues.filter((id) => id !== venue.id)
      : [...favoriteVenues, venue.id];
    setFavoriteVenues(next);
    localStorage.setItem(FAVORITE_VENUES_KEY, JSON.stringify(next));
  };
  const tmAddress = [
    ticketmaster?.address?.line1,
    ticketmaster?.address?.line2,
    ticketmaster?.address?.line3,
    ticketmaster?.city?.name,
    ticketmaster?.state?.name,
    ticketmaster?.postalCode,
    ticketmaster?.country?.name,
  ]
    .filter(Boolean)
    .join(", ");
  const fields = services.fields || {};
  const addressSource = !ticketmaster?.address?.line1 && !info.address ? fields.address : null;
  const address = ticketmaster?.address?.line1 ? tmAddress : info.address || fields.address?.value;
  const addressUrl = address
    ? (fields.address?.source === "Google Maps" && safeUrl(fields.address.url)) ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue.name, address].filter(Boolean).join(", "))}`
    : undefined;
  const phoneNumber = String(fields.phone?.value || "").replace(/[^\d+]/g, "");
  const phoneUrl = /^\+?\d{5,15}$/.test(phoneNumber) ? `tel:${phoneNumber}` : undefined;
  const website = [
    info.officialWebsite,
    ticketmaster?.externalLinks?.homepage?.[0]?.url,
    fields.website?.value,
  ]
    .map(safeUrl)
    .find(Boolean);
  const rows = [
    [
      "city",
      t("City"),
      [venue.city?.name, venue.city?.state, venue.city?.country?.name].filter(Boolean).join(", "),
    ],
    ["address", t("Address"), address, addressSource],
    ["phone", t("Phone"), fields.phone?.value],
  ];
  const descriptionSource = !info.description ? fields.description : null;
  const description = info.description || fields.description?.value;
  // Google's editorial summaries must be displayed intact.
  const hasMore = descriptionSource?.source !== "Google Maps" && description?.length > 300;
  const biographyMask =
    hasMore && !expanded
      ? "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)"
      : undefined;
  return (
    <section aria-label={t("Venue information")} className="w-full min-w-0">
      <CardTitle
        action={
          <button
            type="button"
            onClick={toggleFavorite}
            aria-pressed={isFavorite}
            title={isFavorite ? t("Remove from favorites") : t("Favorite this venue")}
            aria-label={isFavorite ? t("Remove venue from favorites") : t("Favorite this venue")}
            className={isFavorite ? "text-red-600" : "text-zinc-500 hover:text-red-600"}
          >
            <Icon icon={isFavorite ? faHeartSolid : faHeartRegular} className="text-2xl" />
          </button>
        }
      >
        {venue.name}
      </CardTitle>
      <ol className="px-[12px]">
        <li className="border-b border-zinc-300/50 py-2">
          <p
            id="venue-about"
            className="whitespace-pre-line text-base leading-relaxed text-zinc-700 mb-2"
            style={{ maskImage: biographyMask, WebkitMaskImage: biographyMask }}
          >
            <span className="font-semibold">{t("About:")}</span>&ensp;
            {description
              ? hasMore && !expanded
                ? `${description.slice(0, 300).replace(/\s+\S*$/, "")}…`
                : description
              : empty("description")}
          </p>
          {descriptionSource && (!hasMore || expanded) && (
            <VenueSource detail={descriptionSource} />
          )}
          {info.description && (!hasMore || expanded) && (
            <p className="mt-[1.625rem] mb-3 text-center text-xs text-zinc-500">
              {t("Source:")}{" "}
              <a
                href={safeUrl(info.wikipediaUrl)}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-red-600"
              >
                Wikipedia
              </a>
              {" · "}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-red-600"
              >
                CC BY-SA 4.0
              </a>
            </p>
          )}
          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls="venue-about"
                onClick={() => setExpanded(!expanded)}
                className="text-base text-red-600 hover:text-red-800 font-semibold"
              >
                {expanded ? t("Show Less") : t("View More")}
              </button>
            </div>
          )}
        </li>
        {rows.map(([field, label, value, source]) => (
          <li
            key={field}
            className="border-b border-zinc-300/50 py-2 whitespace-pre-line break-words"
          >
            <span className="font-semibold">{label}:</span>&ensp;
            {field === "phone" && <Icon icon={faPhone} className="mr-2 text-red-600" />}
            {field === "address" && value ? (
              <a
                href={addressUrl}
                target="_blank"
                rel="noreferrer"
                className="text-red-600 hover:text-red-800"
              >
                {value}
              </a>
            ) : field === "phone" && phoneUrl ? (
              <a href={phoneUrl} className="text-red-600 hover:text-red-800">
                {value}
              </a>
            ) : (
              value || empty(field)
            )}
            <VenueSource detail={source} />
          </li>
        ))}
        <li className="border-b border-zinc-300/50 py-2 break-words">
          <span className="font-semibold">{t("Website:")}</span>&ensp;
          <Icon icon={faGlobe} className="mr-2 text-red-600" />
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="text-red-600 hover:text-red-800"
            >
              {website}
            </a>
          ) : (
            empty("website")
          )}
        </li>
      </ol>
    </section>
  );
}
