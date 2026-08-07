import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faCirclePlay } from "@fortawesome/free-solid-svg-icons";
import { faFileLines } from "@fortawesome/free-regular-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import LyricsDropdown from "../LyricsDropdown";
import {
  getSpotifyAuthUrl,
} from "../../helpers/spotifyAuth";
import { createSpotifyPlaylist } from "../../helpers/spotifyPlaylist";

export default function Setlist(props) {
  const [expandedLyrics, setExpandedLyrics] = useState(null);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  const concert = props.concert;
  const songs = concert.sets?.set[0]?.song || [];
  const artistName = concert.artist.name;
  const tourName = concert.tour?.name || "";
  const concertDate = concert.eventDate || "";

  // Listen for auth success from popup
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data.type === "SPOTIFY_AUTH_SUCCESS") {
        console.log("Auth successful, creating playlist...");
        // If playlist data came from popup, use it
        const playlistData = event.data.playlistData;
        if (playlistData) {
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
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      "spotify_auth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleExportSetlist = () => {
    const setlistText = songs
      .map((song, idx) => `${idx + 1}. ${song.name}`)
      .join("\n");

    const fullText = `${artistName} - ${venueName}\n${concertDate}\n\n${setlistText}`;
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artistName}_${concertDate}_setlist.txt`;
    a.click();
  };

  const displaySongs = showAllSongs ? songs : songs.slice(0, 5);

  return (
    <>
      <div className="flex flex-1 justify-between items-center mb-2">
        <h2 className="text-4xl font-bold">Setlist</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSpotifyPlaylist}
            disabled={creatingPlaylist}
            className="p-1 hover:text-red-800 disabled:opacity-50"
            title="Create Spotify Playlist"
          >
            <FontAwesomeIcon
              icon={faMusic}
              className="text-red-600"
              spin={creatingPlaylist}
            />
          </button>
          <button
            onClick={handleExportSetlist}
            className="p-1 hover:text-red-800"
            title="Export Setlist"
          >
            <FontAwesomeIcon icon={faCircleInfo} className="text-gray-500" />
          </button>
        </div>
      </div>

      <hr className="border-t border-gray-300 opacity-50 ml-6" />

      {songs.length === 0 ? (
        <span className="py-2 ml-6 block text-gray-500">
          There are no songs in this setlist. Please come back later.
        </span>
      ) : (
        <>
          <ol className="list-decimal list-inside pl-6">
            {displaySongs.map((song, songIndex) => {
              const query = encodeURIComponent(`${artistName} ${song.name}`);
              const spotifyUrl = `https://open.spotify.com/search/${query}`;
              const youtubeUrl = `https://www.youtube.com/results?search_query=${query}`;

              return (
                <div key={songIndex}>
                  <li className="flex items-center justify-between border-b border-gray-300/50 py-1">
                    <span className="flex items-center space-x-2">
                      <span>{song.name}</span>
                    </span>

                    <span className="flex items-center space-x-3">
                      <a href={spotifyUrl} target="_blank" rel="noreferrer">
                        <FontAwesomeIcon
                          icon={faMusic}
                          className="text-red-600 hover:text-red-800"
                          title="Spotify"
                        />
                      </a>
                      <a href={youtubeUrl} target="_blank" rel="noreferrer">
                        <FontAwesomeIcon
                          icon={faCirclePlay}
                          className="text-red-600 hover:text-red-800"
                          title="YouTube"
                        />
                      </a>
                      <button
                        onClick={() =>
                          setExpandedLyrics(
                            expandedLyrics === songIndex ? null : songIndex
                          )
                        }
                      >
                        <FontAwesomeIcon
                          icon={faFileLines}
                          className="text-red-600 hover:text-red-800"
                          title="Lyrics"
                        />
                      </button>
                    </span>
                  </li>

                  {expandedLyrics === songIndex && (
                    <div className="pl-6 mb-2">
                      <LyricsDropdown
                        songName={song.name}
                        artistName={artistName}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </ol>

          {songs.length > 5 && !showAllSongs && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAllSongs(true)}
                className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-800"
              >
                Show all {songs.length} songs
              </button>
            </div>
          )}

          {showAllSongs && songs.length > 5 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowAllSongs(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
              >
                Show less
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
