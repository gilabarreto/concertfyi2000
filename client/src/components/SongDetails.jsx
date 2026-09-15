import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faCirclePlay } from "@fortawesome/free-solid-svg-icons";
import { faFileLines } from "@fortawesome/free-regular-svg-icons";
import { getSpotifyAuthUrl, getStoredAccessToken } from "../helpers/spotifyAuth";
import { useLyrics, useYoutubeVideo, useSpotifyTrack } from "../api/queries";

export default function SongDetails({ songName, artistName }) {
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [token, setToken] = useState(getStoredAccessToken);
  const lyricsRef = useRef(null);

  const { data: lyrics = "", isLoading: loading, isError: lyricsError } = useLyrics(artistName, songName);
  const { data: videoId } = useYoutubeVideo(artistName, songName);
  const { data: trackUri, isLoading: playerLoading, error: trackError } = useSpotifyTrack(artistName, songName, token);

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

  const handleConnectSpotify = () => {
    const authUrl = getSpotifyAuthUrl();
    const width = 420;
    const height = 320;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      "spotify_auth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const lyricsLines = lyrics.split("\n");
  const previewLines = lyricsLines.slice(0, 5).join("\n");
  const hasMoreLyrics = lyricsLines.length > 5;

  const toggleLyrics = () => {
    setShowFullLyrics(!showFullLyrics);
    if (showFullLyrics) {
      setTimeout(() => lyricsRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 space-y-4 sm:p-4">
      {/* Spotify Embed or Connect Button */}
      {trackUri && hasToken ? (
        <iframe
          className="w-full rounded"
          height="80"
          src={`https://open.spotify.com/embed/track/${trackUri.split(":")[2]}`}
          title={`${songName} on Spotify`}
          allow="encrypted-media; clipboard-write"
        />
      ) : !hasToken ? (
        <button
          onClick={handleConnectSpotify}
          className="w-full px-4 py-2 text-md font-semibold text-white bg-green-600 hover:bg-green-700 rounded flex items-center justify-center gap-2 transition-colors"
          title="Connect to Spotify"
        >
          <FontAwesomeIcon icon={faSpotify} />
          Connect to Listen
        </button>
      ) : playerLoading ? (
        <p className="text-sm text-gray-500">Loading Spotify track...</p>
      ) : null}

      {/* Lyrics Section */}
      <div ref={lyricsRef}>
        <h3 className="text-base font-semibold text-gray-700 mb-2 text-center">
          <FontAwesomeIcon
            icon={faFileLines}
            className="text-sm text-red-600 hover:text-red-800"
            title="Lyrics"
          /> Lyrics</h3>
        {loading && <p className="text-sm text-gray-500">Loading lyrics...</p>}
        {lyricsError && <p className="text-sm text-red-600 italic">Could not load lyrics</p>}
        {lyrics && !loading && (
            <>
              <pre
                className="text-base leading-relaxed font-sans text-gray-700 whitespace-pre-wrap break-words mb-2 overflow-y-auto text-center"
                style={{
                  maskImage: showFullLyrics
                    ? 'none'
                    : 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: showFullLyrics
                    ? 'none'
                    : 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
                }}
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
            <FontAwesomeIcon
              icon={faCirclePlay}
              className="text-sm text-red-600 hover:text-red-800"
              title="YouTube"
            /> Music Video</h3>
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
