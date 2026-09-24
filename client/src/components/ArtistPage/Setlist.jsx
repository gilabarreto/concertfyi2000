import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import {
  faChevronDown,
  faChevronUp,
  faCircleInfo,
  faCopy,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import SongDetails from "../SongDetails";
import Pagination from "../Pagination";
import { openSpotifyAuthPopup, getStoredAccessToken } from "../../helpers/spotifyAuth";
import { createSpotifyPlaylist } from "../../helpers/spotifyPlaylist";
import { parseSetlistDate, dateLabel } from "../../helpers/selectors";

const PAGE_SIZE = 10;

export default function Setlist({ concert }) {
  const navigate = useNavigate();
  const [expandedLyrics, setExpandedLyrics] = useState(null);
  const [page, setPage] = useState(0);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [copied, setCopied] = useState(false);
  const disclaimerRef = useRef(null);
  const titleRef = useRef(null);
  const copyTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  // setlist.fm marks a set as an encore with `set.encore` (unset on the main sets). mainSongs'
  // length is where the encore starts, kept apart just to draw a divider before it below —
  // every set in order, encore included, so the numbering stays the order actually played.
  const sets = concert.sets?.set || [];
  const mainSongs = sets.filter((set) => set.encore == null).flatMap((set) => set.song || []);
  const encoreSongs = sets.filter((set) => set.encore != null).flatMap((set) => set.song || []);
  const songs = [...mainSongs, ...encoreSongs];
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

    openSpotifyAuthPopup();
  };

  const handleCopySetlist = async () => {
    const lines = [];
    songs.forEach((song, i) => {
      if (encoreSongs.length > 0 && i === mainSongs.length) lines.push("", "Encore");
      lines.push(`${i + 1}. ${song.name}`);
    });
    const header = `${artistName} - ${concert.venue?.name || "Concert"} - ${dateLabel(parseSetlistDate(concertDate))}`;
    const text = [header, "", ...lines].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (no permission, insecure context) — nothing to recover from here
    }
  };

  const paginated = songs.length > PAGE_SIZE;
  const pageCount = Math.ceil(songs.length / PAGE_SIZE);
  // clamps a page left stale from a longer setlist (e.g. switching concerts) instead of
  // rendering a blank page past the end
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const offset = paginated ? currentPage * PAGE_SIZE : 0;
  const displaySongs = songs.slice(offset, offset + PAGE_SIZE);

  const goToPage = (next) => {
    setExpandedLyrics(null);
    setPage(next);
    // the next page is often shorter than the one scrolled into, which leaves the
    // viewport sitting over Past Concerts with nothing above it to explain why
    setTimeout(() => titleRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  return (
    <>
      <div className="flex flex-1 justify-between items-center mb-2">
        <h2 ref={titleRef} className="text-2xl font-bold">
          Setlist
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopySetlist}
            className="p-1 hover:text-red-800 active:opacity-70 transition-opacity"
            title="Copy setlist"
            aria-label="Copy setlist"
          >
            <Icon
              icon={copied ? faCheck : faCopy}
              className={copied ? "text-green-600" : "text-zinc-500"}
            />
          </button>
          <span role="status" aria-live="polite" className="sr-only">
            {copied ? "Setlist copied to clipboard" : ""}
          </span>
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
            <Icon icon={faCircleInfo} className="text-zinc-500" />
          </button>
        </div>
      </div>

      <hr className="border-t border-zinc-300 opacity-50 ml-6" />

      <>
        {songs.length === 0 ? (
          <span className="py-2 ml-6 block text-zinc-500">
            No songs in this setlist. Check back later.
          </span>
        ) : (
          <>
            <ol className="pl-6">
              {displaySongs.map((song, i) => {
                const songIndex = offset + i;
                const isEncoreStart = encoreSongs.length > 0 && songIndex === mainSongs.length;
                return (
                  <li key={songIndex} className="flex flex-col">
                    {isEncoreStart && (
                      <span className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Encore
                      </span>
                    )}
                    <div className="flex items-center justify-between border-b border-zinc-300/50 py-2">
                      {/* the li is a flex container, which swallows the list marker, so the
                        position gets its own cell */}
                      <span className="flex flex-1 items-center gap-2">
                        <span className="tabular-nums text-zinc-500">{songIndex + 1}.</span>
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

            {paginated && (
              <Pagination
                currentPage={currentPage}
                totalPages={pageCount}
                onPageChange={goToPage}
                label="Setlist pages"
              />
            )}

            <div className="flex justify-center ml-6 bg-white px-2 py-3 sm:px-4">
              <button
                onClick={handleSpotifyPlaylist}
                disabled={creatingPlaylist}
                aria-busy={creatingPlaylist}
                className={`w-full px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${creatingPlaylist ? "animate-pulse motion-reduce:animate-none" : ""}`}
                title="Create Spotify Playlist"
              >
                <Icon icon={faSpotify} />
                {creatingPlaylist ? "Creating playlist…" : "Create Spotify Playlist"}
              </button>
            </div>
          </>
        )}
      </>

      {/* native modal: focus trap, Esc to close and focus return come from the browser */}
      <dialog
        ref={disclaimerRef}
        aria-labelledby="disclaimer-title"
        className="bg-white rounded-lg p-8 w-[calc(100%-2rem)] max-w-md backdrop:bg-black/50"
      >
        <h3 id="disclaimer-title" className="text-xl font-bold mb-4">
          Disclaimer
        </h3>
        <div className="text-sm text-zinc-700 space-y-3 mb-6">
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
