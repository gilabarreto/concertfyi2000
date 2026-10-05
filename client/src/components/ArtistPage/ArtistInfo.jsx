import { useState } from "react";
import Icon from "../Icon";
import ArtistPhotos from "./ArtistPhotos";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons/faHeart";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons/faHeart";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons/faXTwitter";
import { faYoutube } from "@fortawesome/free-brands-svg-icons/faYoutube";
import { faWikipediaW } from "@fortawesome/free-brands-svg-icons/faWikipediaW";
import { getTicketmasterGenres } from "../../helpers/selectors";
import { useArtistBackground } from "../../api/queries";
import { useParams } from "react-router-dom";
import CardTitle from "./CardTitle";

import { useT } from "../../i18n";
const FAVORITE_ARTISTS_KEY = "favoriteArtistIds";

function getFavoriteArtists() {
  return JSON.parse(localStorage.getItem(FAVORITE_ARTISTS_KEY) || "[]");
}

// O href vem do `externalLinks` da Ticketmaster, ou seja, de fora. O React 18 avisa no
// console de desenvolvimento quando o href é `javascript:`, mas renderiza assim mesmo —
// quem clicasse rodaria o script na origem do concertfyi.com. Um href indefinido vira
// texto inerte, que é a falha certa aqui.
const httpOnly = (url) => (/^https?:\/\//i.test(url) ? url : undefined);

const SOCIALS = [
  { key: "youtube", icon: faYoutube, label: "YouTube" },
  { key: "instagram", icon: faInstagram, label: "Instagram" },
  { key: "twitter", icon: faXTwitter, label: "X" },
];

export default function ArtistInfo(props) {
  const t = useT();
  const { concert, attraction } = props;
  const { artistId } = useParams();
  const [favoriteArtists, setFavoriteArtists] = useState(getFavoriteArtists);
  const [showFullBiography, setShowFullBiography] = useState(false);

  const isFavorite = favoriteArtists.includes(artistId);
  const toggleFavorite = () => {
    const next = isFavorite
      ? favoriteArtists.filter((id) => id !== artistId)
      : [...favoriteArtists, artistId];
    setFavoriteArtists(next);
    localStorage.setItem(FAVORITE_ARTISTS_KEY, JSON.stringify(next));
  };

  const links = attraction?.externalLinks || {};
  const hasSocials = SOCIALS.some(({ key }) => links[key]);
  const socialIcons = SOCIALS.map(({ key, icon, label }) =>
    links[key] ? (
      <a
        key={key}
        href={httpOnly(links[key][0].url)}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
      >
        <Icon icon={icon} className="text-2xl text-zinc-500" />
      </a>
    ) : null,
  );

  const artist = concert.artist.name;
  const { data: background = {}, isLoading: isBackgroundLoading } = useArtistBackground(artist);
  const hasMoreBiography = (background.extract?.length || 0) > 300;
  const biographyMask =
    hasMoreBiography && !showFullBiography
      ? "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)"
      : undefined;
  const displayGenres = getTicketmasterGenres(attraction);
  // A fonte só aparece com o texto inteiro à mostra (View Less aberto, ou bio curta sem
  // botão — nessa a CC BY-SA ainda exige o crédito da Wikipedia).
  const showSource = !hasMoreBiography || showFullBiography;
  const source = (
    <>
      {t("Source:")}{" "}
      <a
        href={httpOnly(background.pageUrl)}
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
    </>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row items-start gap-4">
      <div className="flex flex-col items-center w-full lg:flex-1 lg:min-w-0">
        <ArtistPhotos artistId={artistId} artist={artist} attraction={attraction} />
      </div>

      <div className="w-full lg:flex-1 lg:min-w-0">
        <CardTitle
          action={
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
              title={isFavorite ? t("Remove from favorites") : t("Favorite this artist")}
              aria-label={
                isFavorite ? t("Remove artist from favorites") : t("Favorite this artist")
              }
              className={isFavorite ? "text-red-600" : "text-zinc-500 hover:text-red-600"}
            >
              <Icon icon={isFavorite ? faHeartSolid : faHeartRegular} className="text-2xl" />
            </button>
          }
        >
          {artist}
        </CardTitle>

        <ol className="px-[12px]">
          {isBackgroundLoading && (
            <li className="border-b border-zinc-300/50 py-2 text-zinc-400">{t("Loading…")}</li>
          )}
          {!isBackgroundLoading && (
            <li className="border-b border-zinc-300/50 py-2">
              {background.extract ? (
                <>
                  <p
                    id="artist-biography"
                    className="whitespace-pre-line text-base leading-relaxed text-zinc-700 mb-2"
                    style={{ maskImage: biographyMask, WebkitMaskImage: biographyMask }}
                  >
                    <span className="font-semibold">{t("Bio:")}</span>&ensp;
                    {hasMoreBiography && !showFullBiography
                      ? `${background.extract.slice(0, 300).replace(/\s+\S*$/, "")}…`
                      : background.extract}
                  </p>
                  {/* Afastada da bio por uma linha dela (text-base leading-relaxed = 1.625rem). */}
                  {showSource && (
                    <p className="mt-[1.625rem] mb-3 text-center text-xs text-zinc-500">{source}</p>
                  )}
                  {hasMoreBiography && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowFullBiography((value) => !value)}
                        aria-expanded={showFullBiography}
                        aria-controls="artist-biography"
                        className="text-base text-red-600 hover:text-red-800 font-semibold"
                      >
                        {showFullBiography ? t("Show Less") : t("View More")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-zinc-500">
                  {t("No biography available for this artist yet. Check back later.")}
                </p>
              )}
            </li>
          )}
          {displayGenres.length > 0 && (
            <li className="border-b border-zinc-300/50 py-2">
              <span className="font-semibold">{t("Genres:")}</span>&ensp;
              {displayGenres.join(", ")}
            </li>
          )}
        </ol>
        {(hasSocials || background.pageUrl) && (
          <div
            className="flex justify-center items-center gap-4 py-3"
            aria-label={t("Artist links")}
          >
            {socialIcons}
            {background.pageUrl && (
              <a
                href={httpOnly(background.pageUrl)}
                target="_blank"
                rel="noreferrer"
                aria-label="Wikipedia"
              >
                <Icon icon={faWikipediaW} className="text-2xl text-zinc-500" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
