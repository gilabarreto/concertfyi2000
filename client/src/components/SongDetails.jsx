import { useState, useEffect } from "react";
import { Spotify } from "react-spotify-embed";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { getSpotifyAuthUrl } from "../helpers/spotifyAuth";

export default function SongDetails({ songName, artistName }) {
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [trackUri, setTrackUri] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    setHasToken(!!token);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "SPOTIFY_AUTH_SUCCESS") {
        setHasToken(true);
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

  useEffect(() => {
    const fetchLyrics = async () => {
      setLoading(true);
      setError("");
      setLyrics("");

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/lyrics?artist=${encodeURIComponent(artistName)}&song=${encodeURIComponent(songName)}`
        );

        if (!response.ok) {
          throw new Error("Lyrics not found");
        }

        const data = await response.json();
        setLyrics(data.lyrics || "No lyrics found");
      } catch (err) {
        setError("Could not load lyrics");
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [songName, artistName]);

  useEffect(() => {
    const fetchTrackUri = async () => {
      setPlayerLoading(true);
      try {
        const token = localStorage.getItem("spotify_access_token");
        if (!token) return;

        const query = encodeURIComponent(`${artistName} ${songName}`);
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setHasToken(false);
            localStorage.removeItem("spotify_access_token");
          }
          throw new Error("Failed to search track");
        }

        const data = await response.json();
        if (data.tracks?.items?.[0]?.uri) {
          setTrackUri(data.tracks.items[0].uri);
        }
      } catch (err) {
        // Track URI fetch failed
      } finally {
        setPlayerLoading(false);
      }
    };

    fetchTrackUri();
  }, [songName, artistName, hasToken]);

  const lyricsLines = lyrics.split("\n");
  const previewLines = lyricsLines.slice(0, 5).join("\n");
  const hasMoreLyrics = lyricsLines.length > 5;

  const youtubeQuery = encodeURIComponent(`${artistName} ${songName}`);

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 space-y-4 sm:p-4">
      {/* Spotify Embed or Connect Button */}
      {trackUri && hasToken ? (
        <div className="overflow-hidden rounded">
          <Spotify
            link={`https://open.spotify.com/track/${trackUri.split(':')[2]}`}
            wide={true}
          />
        </div>
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
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-2">Lyrics</h3>
        {loading && <p className="text-sm text-gray-500">Loading lyrics...</p>}
        {error && <p className="text-sm text-red-600 italic">{error}</p>}
        {lyrics && !loading && (
          <>
            <pre
              className="text-sm leading-relaxed font-sans text-gray-700 whitespace-pre-wrap break-words mb-2 overflow-y-auto"
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
              <button
                onClick={() => setShowFullLyrics(!showFullLyrics)}
                className="text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                {showFullLyrics ? "Show Less" : "View More"}
              </button>
            )}
          </>
        )}
      </div>

      {/* YouTube Video */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">📺 Music Video</h3>
        <a
          href={`https://www.youtube.com/results?search_query=${youtubeQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
        >
          🔍 Watch on YouTube
        </a>
      </div>
    </div>
  );
}
