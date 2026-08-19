import { useState, useEffect } from "react";

export default function SongDetails({ songName, artistName }) {
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFullLyrics, setShowFullLyrics] = useState(false);

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

  // Split lyrics into lines for preview
  const lyricsLines = lyrics.split("\n");
  const previewLines = lyricsLines.slice(0, 3).join("\n");
  const hasMoreLyrics = lyricsLines.length > 3;

  // Create search queries
  const spotifyQuery = encodeURIComponent(`${artistName} ${songName}`);
  const youtubeQuery = encodeURIComponent(`${artistName} ${songName}`);

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-4 space-y-4">
      {/* Spotify Link */}
      <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-300">
        <span className="text-sm font-semibold text-gray-700">🎵 Listen on Spotify</span>
        <a
          href={`https://open.spotify.com/search/${spotifyQuery}`}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          Open
        </a>
      </div>

      {/* Lyrics Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Lyrics</h3>
        {loading && <p className="text-sm text-gray-500">Loading lyrics...</p>}
        {error && <p className="text-sm text-red-600 italic">{error}</p>}
        {lyrics && !loading && (
          <>
            <pre className="text-xs leading-relaxed font-sans text-gray-700 whitespace-pre-wrap break-words mb-2">
              {showFullLyrics ? lyrics : previewLines}
            </pre>
            {hasMoreLyrics && (
              <button
                onClick={() => setShowFullLyrics(!showFullLyrics)}
                className="text-xs text-red-600 hover:text-red-800 font-semibold"
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
          rel="noreferrer"
          className="block p-3 bg-white rounded border border-gray-300 text-center hover:bg-gray-50"
        >
          <div className="text-sm text-gray-600">Search on YouTube</div>
          <div className="text-xs text-gray-500 mt-1">{artistName} - {songName}</div>
        </a>
      </div>
    </div>
  );
}
