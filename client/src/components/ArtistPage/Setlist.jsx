import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import SongDetails from "../SongDetails";
import {
  getSpotifyAuthUrl,
} from "../../helpers/spotifyAuth";
import { createSpotifyPlaylist } from "../../helpers/spotifyPlaylist";

export default function Setlist(props) {
  const navigate = useNavigate();
  const [expandedLyrics, setExpandedLyrics] = useState(null);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const concert = props.concert;
  const songs = concert.sets?.set[0]?.song || [];
  const artistName = concert.artist.name;
  const tourName = concert.tour?.name || "";
  const concertDate = concert.eventDate || "";

  // Listen for auth success from popup
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data.type === "SPOTIFY_AUTH_SUCCESS") {
        console.log("Auth successful, checking for playlist data...");
        // Only create playlist if we have stored playlist data
        const storedData = localStorage.getItem("spotifyPlaylistData");
        if (storedData) {
          console.log("Creating playlist...");
          const playlistData = JSON.parse(storedData);
          setCreatingPlaylist(true);
          try {
            const playlist = await createSpotifyPlaylist(
              playlistData.songs,
              playlistData.artistName,
              playlistData.tourName,
              playlistData.concertDate
            );
            console.log("Playlist created, opening...");
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

  const createPlaylist = async () => {
    setCreatingPlaylist(true);
    try {
      const playlist = await createSpotifyPlaylist(
        songs,
        artistName,
        tourName,
        concertDate
      );
      console.log("Playlist created, opening...");
      window.open(playlist.external_urls.spotify, "_blank");
    } catch (err) {
      console.error("Failed to create playlist:", err);
      alert("Failed to create playlist. Please try again.");
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleSpotifyPlaylist = async () => {
    if (creatingPlaylist) return;

    // Store playlist data in localStorage (shared between popup and parent)
    localStorage.setItem("spotifyPlaylistData", JSON.stringify({
      songs,
      artistName,
      tourName,
      concertDate
    }));

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


  const displaySongs = showAllSongs ? songs : songs.slice(0, 5);

  return (
    <>
      <div className="flex flex-1 justify-between items-center mb-2">
        <h2 className="text-3xl font-bold">Setlist</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDisclaimer(true)}
            onTouchEnd={() => setShowDisclaimer(true)}
            className="p-2 hover:text-red-800 active:opacity-70 transition-opacity"
            title="Disclaimer"
          >
            <FontAwesomeIcon icon={faCircleInfo} className="text-gray-500" />
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
          <ol className="list-decimal list-inside pl-6">
            {displaySongs.map((song, songIndex) => {
              return (
                <div key={songIndex}>
                  <li className="flex items-center justify-between border-b border-gray-300/50 py-2">
                    <span className="flex items-center space-x-2 flex-1">
                      <span>{song.name}</span>
                    </span>

                    <button
                      onClick={() => setExpandedLyrics(
                        expandedLyrics === songIndex ? null : songIndex
                      )}
                      className="p-1 hover:text-red-800 ml-2"
                    >
                      <FontAwesomeIcon
                        icon={expandedLyrics === songIndex ? faChevronUp : faChevronDown}
                        className="text-red-600"
                      />
                    </button>
                  </li>

                  {expandedLyrics === songIndex && (
                    <SongDetails
                      songName={song.name}
                      artistName={artistName}
                    />
                  )}
                </div>
              );
            })}
          </ol>

          {songs.length > 5 && !showAllSongs && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAllSongs(true)}
                className="px-4 py-2 text-md font-semibold text-red-600 hover:text-red-800"
              >
                Show all {songs.length} songs
              </button>
            </div>
          )}

          {showAllSongs && songs.length > 5 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAllSongs(false)}
                className="px-4 py-2 text-md font-semibold text-gray-600 hover:text-gray-800"
              >
                Show less
              </button>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <style>{`
              @keyframes pulse-flash {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
              .flash-loading {
                animation: pulse-flash 1.5s ease-in-out infinite;
              }
            `}</style>
            <button
              onClick={handleSpotifyPlaylist}
              disabled={creatingPlaylist}
              className={`px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded disabled:opacity-50 flex items-center gap-2 ${creatingPlaylist ? 'flash-loading' : ''}`}
              title="Create Spotify Playlist"
            >
              <FontAwesomeIcon icon={faSpotify} />
              Create Spotify Playlist
            </button>
          </div>
        </>
      )}

      {showDisclaimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <h3 className="text-xl font-bold mb-4">Disclaimer</h3>
            <div className="text-sm text-gray-700 space-y-3 mb-6">
              <p>
                ConcertFYI uses information from third-party sources. We don't own or control all of the content displayed here.
              </p>
              <p>
                Found something missing or incorrect?{" "}
                <button
                  onClick={() => {
                    setShowDisclaimer(false);
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
              onClick={() => setShowDisclaimer(false)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-800 text-white font-semibold rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
