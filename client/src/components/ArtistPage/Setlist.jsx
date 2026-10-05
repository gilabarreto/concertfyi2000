import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import { faBackward } from "@fortawesome/free-solid-svg-icons/faBackward";
import { faForward } from "@fortawesome/free-solid-svg-icons/faForward";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons/faChevronUp";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons/faShareNodes";
import { faCopy } from "@fortawesome/free-solid-svg-icons/faCopy";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faSpotify } from "@fortawesome/free-brands-svg-icons/faSpotify";
import SongDetails from "../SongDetails";
import Pagination from "../Pagination";
import { openSpotifyAuthPopup, getStoredAccessToken } from "../../helpers/spotifyAuth";
import { createSpotifyPlaylist } from "../../helpers/spotifyPlaylist";
import { getPastConcertsByArtist, parseSetlistDate, dateLabel } from "../../helpers/selectors";
import CardTitle from "./CardTitle";
import CardNotice from "./CardNotice";
import { getTicketmasterEventImage, shareOrCopy } from "../../helpers/share";

// Páginas de 10, com paginação só acima disso.
const PAGE_SIZE = 10;

export default function Setlist({ concert, setlist, ticketmaster, fallbackImage }) {
  const navigate = useNavigate();
  const [expandedLyrics, setExpandedLyrics] = useState(null);
  const [page, setPage] = useState(0);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareTimerRef = useRef(null);
  const titleRef = useRef(null);
  const copyTimerRef = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(copyTimerRef.current);
      clearTimeout(shareTimerRef.current);
    },
    [],
  );

  const shareSetlist = async () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("next");
    url.hash = "setlist";
    const city = concert.venue?.city?.name;
    const place = [concert.venue?.name, city].filter(Boolean).join(", ");
    const localDate = concert.eventDate.split("-").reverse().join("-");
    const imageUrl =
      getTicketmasterEventImage(
        ticketmaster?.events,
        concert.artist.name,
        localDate,
        concert.venue?.name,
      ) || fallbackImage;
    const text = `Check out ${concert.artist.name}'s setlist from their concert at ${place || "the concert venue"} on ${dateLabel(parseSetlistDate(concert.eventDate))}.`;
    const title = `${concert.artist.name} setlist`;

    if (await shareOrCopy(url.href, title, { text, imageUrl })) {
      setLinkCopied(true);
      clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (window.location.hash !== "#setlist") return;
    const frame = requestAnimationFrame(() => titleRef.current?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [concert.id]);

  // setlist.fm marks a set as an encore with `set.encore` (unset on the main sets). mainSongs'
  // length is where the encore starts, kept apart just to draw a divider before it below —
  // every set in order, encore included, so the numbering stays the order actually played.
  // Mesmas setas do Last Concert: as duas trocam o show da URL, então os dois cards andam
  // juntos. O #setlist mantém a tela no card de onde veio o clique.
  const artistId = concert.artist.mbid;
  const pastConcerts = getPastConcertsByArtist(setlist, artistId);
  const idx = pastConcerts.findIndex((c) => String(c.id) === String(concert.id));
  const olderId = pastConcerts[idx + 1]?.id;
  const newerId = pastConcerts[idx - 1]?.id;
  const goTo = (id) => navigate(`/artists/${artistId}/concerts/${id}#setlist`);

  const sets = concert.sets?.set || [];
  // The first song of a named main set (setlist.fm's "B-Stage", "Acoustic") carries the name,
  // so the list can head it the same way it heads the encore.
  const songsOf = (set) =>
    (set.song || []).map((song, i) =>
      i === 0 && set.name ? { ...song, setName: set.name } : song,
    );
  const mainSongs = sets.filter((set) => set.encore == null).flatMap(songsOf);
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
    const header = `${artistName} · ${concert.venue?.name || "Concert"} · ${dateLabel(parseSetlistDate(concertDate))}`;
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
  const offset = currentPage * PAGE_SIZE;
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
      <CardTitle id="setlist" ref={titleRef} className="scroll-mt-20">
        Setlists
      </CardTitle>

      <div className="mx-[12px] flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-300/50 py-2">
        <span>
          <span className="font-semibold">Concert date:</span>&ensp;
          {olderId && (
            <Icon
              icon={faBackward}
              className="text-xs text-red-600 cursor-pointer mr-2"
              onClick={() => goTo(olderId)}
            />
          )}
          {dateLabel(parseSetlistDate(concertDate))}&ensp;
          {newerId && (
            <Icon
              icon={faForward}
              className="text-xs text-red-600 cursor-pointer"
              onClick={() => goTo(newerId)}
            />
          )}
        </span>
        {/* Linha própria acima da data, centralizada, como no Last/Next Concert. */}
        {songs.length > 0 && (
          <div className="order-first flex w-full items-center justify-center space-x-2 border-b border-zinc-300/50 pb-2">
            <button
              type="button"
              onClick={handleCopySetlist}
              className="pill"
              title="Copy setlist"
              aria-label="Copy setlist"
            >
              <Icon
                icon={copied ? faCheck : faCopy}
                className={copied ? "text-green-600 text-[0.65rem]" : "text-[0.65rem]"}
              />
              {copied ? "COPIED" : "COPY"}
            </button>
            <span role="status" aria-live="polite" className="sr-only">
              {copied ? "Setlist copied to clipboard" : ""}
            </span>
            <button type="button" onClick={shareSetlist} title="Share setlist" className="pill">
              <Icon icon={linkCopied ? faCheck : faShareNodes} className="text-[0.65rem]" />
              {linkCopied ? "LINK COPIED" : "SHARE"}
            </button>
            <span role="status" className="sr-only">
              {linkCopied ? "Setlist link copied" : ""}
            </span>
          </div>
        )}
      </div>

      <>
        {songs.length === 0 ? (
          <CardNotice>No songs available for this setlist yet. Check back later.</CardNotice>
        ) : (
          <>
            {/* Show-level note: "May be incomplete", "Opening act for AC/DC". */}
            {concert.info && (
              <p className="mx-[12px] border-b border-zinc-300/50 py-2 text-xs text-zinc-500">
                {concert.info}
              </p>
            )}
            <ol className="px-[12px]">
              {displaySongs.map((song, i) => {
                const songIndex = offset + i;
                const isEncoreStart = encoreSongs.length > 0 && songIndex === mainSongs.length;
                return (
                  <li key={songIndex} className="flex flex-col">
                    {(isEncoreStart || song.setName) && (
                      <span className="pt-3 pb-1 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        {isEncoreStart ? "Encore" : song.setName}
                      </span>
                    )}
                    <div className="flex items-center justify-between border-b border-zinc-300/50 py-2">
                      {/* the li is a flex container, which swallows the list marker, so the
                        position gets its own cell */}
                      <span className="flex flex-1 items-center gap-2">
                        <span className="tabular-nums text-zinc-500">{songIndex + 1}.</span>
                        <span className="flex flex-col">
                          <span>
                            {song.name}
                            {song.tape && (
                              <span className="ml-2 rounded-full border border-zinc-300 px-1.5 text-[10px] uppercase leading-4 text-zinc-500">
                                Tape
                              </span>
                            )}
                          </span>
                          {/* setlist.fm's per-song notes: cover, guest on stage, free text. */}
                          {(song.cover || song.with || song.info) && (
                            <span className="text-xs text-zinc-500">
                              {[
                                song.cover && `${song.cover.name} cover`,
                                song.with && `with ${song.with.name}`,
                                song.info,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
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

            {/* O space-y-2 do card vence o mt-4 da Pagination; o wrapper devolve o respiro. */}
            {paginated && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pageCount}
                  onPageChange={goToPage}
                  label="Setlist pages"
                />
              </div>
            )}

            <div className="mx-[12px] flex justify-center bg-white px-2 py-3 sm:px-4">
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
    </>
  );
}
