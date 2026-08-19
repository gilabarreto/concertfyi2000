import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LyricsDropdown({ songName, artistName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const fetchLyricsFromOVH = async () => {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}`
    );
    if (!response.ok) throw new Error("Not found");
    const data = await response.json();
    return data.lyrics;
  };

  const fetchLyricsFromChartLyrics = async () => {
    const response = await fetch(
      `https://api.chartlyrics.com/apiv1/searchLyrics?artist=${encodeURIComponent(artistName)}&song=${encodeURIComponent(songName)}`
    );
    if (!response.ok) throw new Error("Not found");
    const data = await response.json();

    if (!data.Result || data.Result.length === 0) {
      throw new Error("No results");
    }

    // Pega o primeiro resultado
    const lyricId = data.Result[0].LyricId;
    const lyricUrl = data.Result[0].LyricUrl;

    // Busca as letras completas
    const lyricResponse = await fetch(
      `https://www.chartlyrics.com/api/lyrics/${lyricId}`
    );
    const lyricData = await lyricResponse.json();

    if (!lyricData.Lyric) throw new Error("No lyrics content");
    return lyricData.Lyric;
  };

  const fetchLyrics = async () => {
    if (fetched) {
      setIsOpen(!isOpen);
      return;
    }

    setLoading(true);
    setError("");
    setLyrics("");

    try {
      // Tenta lyrics.ovh primeiro (mais rápido)
      try {
        const lyricsText = await fetchLyricsFromOVH();
        setLyrics(lyricsText || "No lyrics found");
        setFetched(true);
        setIsOpen(true);
        return;
      } catch (err1) {
        console.log("lyrics.ovh failed, trying ChartLyrics...");

        // Se falhar, tenta ChartLyrics
        try {
          const lyricsText = await fetchLyricsFromChartLyrics();
          setLyrics(lyricsText || "No lyrics found");
          setFetched(true);
          setIsOpen(true);
          return;
        } catch (err2) {
          throw new Error("Lyrics not available");
        }
      }
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
