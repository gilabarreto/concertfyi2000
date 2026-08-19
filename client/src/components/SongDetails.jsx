import { useState, useEffect } from "react";
import { Spotify } from "react-spotify-embed";

export default function SongDetails({ songName, artistName }) {
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [trackUri, setTrackUri] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
        console.error("Error fetching lyrics:", err);
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
        if (!token) {
          console.log("No Spotify token available");
          return;
        }

        const query = encodeURIComponent(`${artistName} ${songName}`);
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to search track");

        const data = await response.json();
        if (data.tracks?.items?.[0]?.uri) {
          setTrackUri(data.tracks.items[0].uri);
        }
      } catch (err) {
        console.error("Error fetching track URI:", err);
      } finally {
        setPlayerLoading(false);
      }
    };

    fetchTrackUri();
  }, [songName, artistName]);

  // Split lyrics into lines for preview
  const lyricsLines = lyrics.split("\n");
  const previewLines = lyricsLines.slice(0, 5).join("\n");
  const hasMoreLyrics = lyricsLines.length > 5;

  const youtubeQuery = encodeURIComponent(`${artistName} ${songName}`);

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 space-y-4 sm:p-4">
      {/* Spotify Embed */}
      {trackUri ? (
        <div className="overflow-hidden rounded">
          <Spotify
            link={`https://open.spotify.com/track/${trackUri.split(':')[2]}`}
            wide={true}
          />
        </div>
      ) : playerLoading ? (
        <p className="text-sm text-gray-500">Loading Spotify track...</p>
      ) : null}

      {/* Lyrics Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Lyrics</h3>
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
