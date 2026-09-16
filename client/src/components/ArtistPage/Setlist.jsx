import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import { faChevronDown, faChevronUp, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import SongDetails from "../SongDetails";
import { getSpotifyAuthUrl, getStoredAccessToken } from "../../helpers/spotifyAuth";
import { createSpotifyPlaylist } from "../../helpers/spotifyPlaylist";

export default function Setlist({ concert }) {
  const navigate = useNavigate();
  const [expandedLyrics, setExpandedLyrics] = useState(null);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const disclaimerRef = useRef(null);

  // every set in order, encore included: set[0] alone dropped the songs after the break,
  // so the numbering has to run across all of them to be the order played
  const songs = concert.sets?.set?.flatMap((set) => set.song || []) || [];
  const artistName = concert.artist.name;
  const tourName = concert.tour?.name || "";
  const concertDate = concert.eventDate || "";

  // Listen for auth success from popup
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data.type === "SPOTIFY_AUTH_SUCCESS") {
        // Only create playlist if we have stored playlist data
        const storedData = localStorage.getItem("spotifyPlaylistData");
        if (storedData) {
          const playlistData = JSON.parse(storedData);
          setCreatingPlaylist(true);
          try {
            const playlist = await createSpotifyPlaylist(
              getStoredAccessToken(),
              playlistData.songs,
              playlistData.artistName,
              playlistData.tourName,
              playlistData.concertDate,
            );
            window.open(playlist.external_urls.spotify, "_blank");
          } catch (err) {
            console.error("Failed to create playlist:", err);
            alert("Failed to create playlist. Please try again.");
          } finally {
            setCreatingPlaylist(false);
            localStorage.removeItem("spotifyPlaylistData");
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSpotifyPlaylist = async () => {
    if (creatingPlaylist) return;

    // Store playlist data in localStorage (shared between popup and parent)
    localStorage.setItem(
      "spotifyPlaylistData",
      JSON.stringify({
        songs,
        artistName,
        tourName,
        concertDate,
      }),
    );

    const authUrl = getSpotifyAuthUrl();
    const width = 420;
    const height = 320;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(authUrl, "spotify_auth", `width=${width},height=${height},left=${left},top=${top}`);
  };

  const displaySongs = showAllSongs ? songs : songs.slice(0, 5);

  return (
    <>
      <div className="flex flex-1 justify-between items-center mb-2">
        <h2 className="text-3xl font-bold">Setlist</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => disclaimerRef.current.showModal()}
            onTouchEnd={(e) => {
              e.preventDefault();
              disclaimerRef.current.showModal();
            }}
            className="p-1 hover:text-red-800 active:opacity-70 transition-opacity"
            title="Disclaimer"
            aria-label="Disclaimer"
            aria-haspopup="dialog"
          >
            <Icon icon={faCircleInfo} className="text-gray-500" />
          </button>
        </div>
      </div>

      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      {songs.length === 0 ? (
        <span className="py-2 ml-6 block text-gray-500">
          No songs in this setlist. Check back later.
        </span>
      ) : (
        <>
          <ol className="pl-6">
            {displaySongs.map((song, songIndex) => {
              return (
                <li key={songIndex} className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-gray-300/50 py-2">
                    {/* the li is a flex container, which swallows the list marker, so the
                        position gets its own cell */}
                    <span className="flex flex-1 items-center gap-2">
                      <span className="tabular-nums text-gray-500">{songIndex + 1}.</span>
                      <span>{song.name}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLyrics(expandedLyrics === songIndex ? null : songIndex)
                      }
                      aria-label={`Details for ${song.name}`}
                      aria-expanded={expandedLyrics === songIndex}
                      className="p-1 hover:text-red-800 ml-2"
                    >
                      <Icon
                        icon={expandedLyrics === songIndex ? faChevronUp : faChevronDown}
                        className="text-red-600"
                      />
                    </button>
                  </div>

                  {expandedLyrics === songIndex && (
                    <SongDetails songName={song.name} artistName={artistName} />
                  )}
                </li>
              );
            })}
          </ol>

          {songs.length > 5 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAllSongs(!showAllSongs)}
                className="px-4 py-2 text-md font-semibold text-red-600 hover:text-red-800"
              >
                {showAllSongs ? "Show less" : `Show all ${songs.length} songs`}
              </button>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <button
              onClick={handleSpotifyPlaylist}
              disabled={creatingPlaylist}
              aria-busy={creatingPlaylist}
              className={`px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded disabled:opacity-50 flex items-center gap-2 ${creatingPlaylist ? "animate-pulse motion-reduce:animate-none" : ""}`}
              title="Create Spotify Playlist"
            >
              <Icon icon={faSpotify} />
              {creatingPlaylist ? "Creating playlist…" : "Create Spotify Playlist"}
            </button>
          </div>
        </>
      )}

      {/* native modal: focus trap, Esc to close and focus return come from the browser */}
      <dialog
        ref={disclaimerRef}
        aria-labelledby="disclaimer-title"
        className="bg-white rounded-lg p-8 w-[calc(100%-2rem)] max-w-md backdrop:bg-black/50"
      >
        <h3 id="disclaimer-title" className="text-xl font-bold mb-4">
          Disclaimer
        </h3>
        <div className="text-sm text-gray-700 space-y-3 mb-6">
          <p>
            ConcertFYI uses information from third-party sources. We don't own or control all of the
            content displayed here.
          </p>
          <p>
            Found something missing or incorrect?{" "}
            <button
              onClick={() => {
                disclaimerRef.current.close();
                navigate("/contact");
              }}
              className="text-red-600 hover:text-red-800 font-semibold cursor-pointer bg-none border-none p-0"
            >
              Please contact us
            </button>{" "}
            and let us know.
          </p>
        </div>
        <button
          onClick={() => disclaimerRef.current.close()}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-800 text-white font-semibold rounded transition-colors"
        >
          Close
        </button>
      </dialog>
    </>
  );
}
