import { useState, useEffect, useRef } from "react";
import Icon from "./Icon";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faCirclePlay } from "@fortawesome/free-solid-svg-icons";
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
  const { data: videoId } = useYoutubeVideo(artistName, songName);
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

  // Sem token não há o que tocar, então o convite vem antes de tudo. Com token e sem faixa
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

    if (playerLoading) return <p className="text-sm text-gray-500">Loading Spotify track...</p>;
    return null;
  };

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 space-y-4 sm:p-4">
      {spotifyPanel()}

      {/* Lyrics Section */}
      <div ref={lyricsRef}>
        <h3 className="text-base font-semibold text-gray-700 mb-2 text-center">
          <Icon
            icon={faFileLines}
            className="text-sm text-red-600 hover:text-red-800"
            title="Lyrics"
          />{" "}
          Lyrics
        </h3>
        {loading && <p className="text-sm text-gray-500">Loading lyrics...</p>}
        {lyricsError && <p className="text-sm text-red-600 italic">Could not load lyrics</p>}
        {lyrics && !loading && (
          <>
            <pre
              className="text-base leading-relaxed font-sans text-gray-700 whitespace-pre-wrap break-words mb-2 overflow-y-auto text-center"
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

      {/* YouTube Video */}
      {videoId && (
        <div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            <Icon
              icon={faCirclePlay}
              className="text-sm text-red-600 hover:text-red-800"
              title="YouTube"
            />{" "}
            Music Video
          </h3>
          <div className="rounded overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
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
        </div>
      )}
    </div>
  );
}
