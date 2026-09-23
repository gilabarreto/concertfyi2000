import { useState, useEffect, useRef } from "react";
import Icon from "./Icon";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faCirclePlay, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { faFileLines } from "@fortawesome/free-regular-svg-icons";
import { openSpotifyAuthPopup, getStoredAccessToken } from "../helpers/spotifyAuth";
import { useLyrics, useYoutubeVideo, useSpotifyTrack } from "../api/queries";

const FADE_OUT = "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)";

export default function SongDetails({ songName, artistName }) {
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [token, setToken] = useState(getStoredAccessToken);
  const lyricsRef = useRef(null);

  const {
    data: lyrics = "",
    isLoading: loading,
    isError: lyricsError,
  } = useLyrics(artistName, songName);
  const {
    data: videoId,
    isLoading: videoLoading,
    isError: videoError,
  } = useYoutubeVideo(artistName, songName);
  const {
    data: trackUri,
    isLoading: playerLoading,
    error: trackError,
  } = useSpotifyTrack(artistName, songName, token);

  // an expired token (401) is cleared by the query; show "Connect" again
  const hasToken = !!token && trackError?.status !== 401;

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "SPOTIFY_AUTH_SUCCESS") {
        setToken(event.data.accessToken);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const lyricsLines = lyrics.split("\n");
  const previewLines = lyricsLines.slice(0, 5).join("\n");
  const hasMoreLyrics = lyricsLines.length > 5;

  // A prévia termina desaparecendo em vez de cortar no meio da linha. `WebkitMaskImage`
  // leva o mesmo valor porque o Safari só entende a propriedade com prefixo.
  const lyricsMask = showFullLyrics ? "none" : FADE_OUT;

  const toggleLyrics = () => {
    setShowFullLyrics(!showFullLyrics);
    if (showFullLyrics) {
      setTimeout(() => lyricsRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  };

  // Sem token, mostramos o convite para conectar. Com token e sem faixa
  // a busca ou está em curso, ou terminou sem achar a música no catálogo — neste último
  // caso não se mostra nada, porque não há erro nenhum a relatar ao ouvinte.
  const spotifyPanel = () => {
    if (!hasToken)
      return (
        <button
          onClick={openSpotifyAuthPopup}
          className="w-full px-4 py-2 text-md font-semibold text-white bg-green-600 hover:bg-green-700 rounded flex items-center justify-center gap-2 transition-colors"
          title="Connect to Spotify"
        >
          <Icon icon={faSpotify} />
          Connect to Listen
        </button>
      );

    if (trackUri)
      return (
        <iframe
          className="w-full rounded"
          height="80"
          src={`https://open.spotify.com/embed/track/${trackUri.split(":")[2]}`}
          title={`${songName} on Spotify`}
          allow="encrypted-media; clipboard-write"
        />
      );

    if (playerLoading) return <p className="text-sm text-zinc-500">Loading Spotify track...</p>;
    return null;
  };

  return (
    <div className="bg-zinc-50 border-b border-zinc-300/50">
      {/* Lyrics Section */}
      <details ref={lyricsRef} className="group/lyrics border-b border-zinc-300/50 p-2 sm:p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-zinc-700 hover:text-red-800 [&::-webkit-details-marker]:hidden">
          <span>
            <Icon icon={faFileLines} className="mr-2 text-sm text-red-600" />
            Lyrics
          </span>
          <span className="shrink-0 text-red-600">
            <Icon icon={faPlus} className="group-open/lyrics:hidden" />
            <Icon icon={faMinus} className="hidden group-open/lyrics:inline-block" />
          </span>
        </summary>
        <div className="mt-3">
          {loading && <p className="text-sm text-zinc-500">Loading lyrics...</p>}
          {lyricsError && (
            <p className="text-sm text-red-600 italic text-center">Could not load lyrics</p>
          )}
          {lyrics && !loading && (
            <>
              <pre
                className="text-base leading-relaxed font-sans text-zinc-700 whitespace-pre-wrap break-words mb-2 overflow-y-auto text-center"
                style={{ maskImage: lyricsMask, WebkitMaskImage: lyricsMask }}
              >
                {showFullLyrics ? lyrics : previewLines}
              </pre>
              {hasMoreLyrics && (
                <div className="flex justify-center">
                  <button
                    onClick={toggleLyrics}
                    className="text-base text-red-600 hover:text-red-800 font-semibold"
                  >
                    {showFullLyrics ? "Show Less" : "View More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </details>

      {/* YouTube Video */}
      <details className="group/video border-b border-zinc-300/50 p-2 sm:p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-zinc-700 hover:text-red-800 [&::-webkit-details-marker]:hidden">
          <span>
            <Icon icon={faCirclePlay} className="mr-2 text-sm text-red-600" />
            Music Video
          </span>
          <span className="shrink-0 text-red-600">
            <Icon icon={faPlus} className="group-open/video:hidden" />
            <Icon icon={faMinus} className="hidden group-open/video:inline-block" />
          </span>
        </summary>
        {videoLoading ? (
          <p className="mt-3 text-sm text-zinc-500 text-center">Loading music video...</p>
        ) : videoError ? (
          <p className="mt-3 text-sm text-red-600 italic text-center">
            Could not load music video.
          </p>
        ) : videoId ? (
          <div className="mt-3 rounded overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={`${artistName} - ${songName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: "block" }}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500 text-center">
            No music video available for this song.
          </p>
        )}
      </details>

      <div className="bg-white px-2 py-3 sm:px-4">{spotifyPanel()}</div>
    </div>
  );
}
