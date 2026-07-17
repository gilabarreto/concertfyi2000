import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LyricsDropdown({ songName, artistName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const fetchLyrics = async () => {
    if (fetched) {
      setIsOpen(!isOpen);
      return;
    }

    setLoading(true);
    setError("");
    setLyrics("");

    try {
      const response = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}`
      );

      if (!response.ok) throw new Error("Lyrics not found");

      const data = await response.json();
      setLyrics(data.lyrics || "No lyrics found");
      setFetched(true);
      setIsOpen(true);
    } catch (err) {
      setError("Could not load lyrics");
      setFetched(true);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={fetchLyrics}
        className="w-full text-left py-2 border-b border-gray-300/50 hover:bg-gray-50 transition-colors"
        disabled={loading}
      >
        <div className="flex items-center justify-between px-6">
          <span className="text-sm font-semibold text-gray-700">
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Loading lyrics...
              </>
            ) : (
              <>
                {songName} - Lyrics
                <span className="ml-2">
                  <FontAwesomeIcon
                    icon={isOpen ? faChevronUp : faChevronDown}
                    className="text-gray-500 text-xs"
                  />
                </span>
              </>
            )}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="bg-gray-50 p-4 border-b border-gray-300/50 max-h-64 overflow-y-auto">
          {error && (
            <p className="text-sm text-red-600 italic">{error}</p>
          )}
          {lyrics && (
            <pre className="text-xs leading-relaxed font-sans text-gray-700 whitespace-pre-wrap break-words">
              {lyrics}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
