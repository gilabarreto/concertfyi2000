import { useEffect, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useSetlistById, useArtistData } from "../api/queries";
import ArtistInfo from "../components/ArtistPage/ArtistInfo";
import ConcertTabs from "../components/ArtistPage/ConcertTabs";
import Setlist from "../components/ArtistPage/Setlist";
import Player from "../components/ArtistPage/Player";
import NearbyConcertBanner from "../components/ArtistPage/NearbyConcertBanner";
import Albums from "../components/ArtistPage/Albums";
import UpcomingConcerts from "../components/ArtistPage/UpcomingConcerts";
import PastConcerts from "../components/ArtistPage/PastConcerts";
import { AppContext } from "../context/AppContext";
import { getArtistAttraction, getUpcomingConcertsByArtist } from "../helpers/selectors";
import { SEOHead } from "../components/SEOHead";

// Índice do mobile: abaixo de lg as abas viram cards empilhados e a página fica longa.
const SECTIONS = [
  ["artist", "Artist"],
  ["last-concert", "Last Concert"],
  ["next-concert", "Next Concert"],
  ["setlist", "Setlists"],
  ["top-tracks", "Top Tracks"],
  ["past-concerts", "Past Concerts"],
  ["upcoming-concerts", "Upcoming Concerts"],
];

export default function ArtistPage() {
  const { setlist = [], ticketmaster = {}, setSetlist, setTicketmaster } = useContext(AppContext);
  const { concertId, artistId } = useParams();
  const menuRef = useRef(null);

  const concert = setlist.find((result) => result.id === concertId);

  // Opened directly (new tab, refresh, shared link): context is empty, so load by URL
  const { data: urlConcert, isError } = useSetlistById(concert ? null : concertId);
  const { data: artistData } = useArtistData(urlConcert?.artist?.name);

  useEffect(() => {
    if (!urlConcert || !artistData) return;
    const list = artistData.setlist;
    setSetlist(list.some((s) => s.id === urlConcert.id) ? list : [urlConcert, ...list]);
    setTicketmaster(artistData.ticketmaster);
  }, [urlConcert, artistData, setSetlist, setTicketmaster]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const observer = new ResizeObserver(() => {
      menu.parentElement.style.setProperty("--section-menu-height", `${menu.offsetHeight}px`);
    });
    observer.observe(menu);
    return () => observer.disconnect();
  }, [concert]);

  if (isError) {
    return (
      <div className="p-8 w-full text-center text-zinc-500">
        Concert not found.{" "}
        <Link to="/" className="text-red-600 underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (!concert) {
    return <div className="p-8 w-full text-center text-zinc-400">Loading concert info…</div>;
  }

  const attraction = getArtistAttraction(ticketmaster, concert.artist.name);
  const artistImage = attraction?.images?.[0]?.url || "";
  const artistName = concert.artist.name;
  const concertDate = concert.eventDate;
  const concertVenue = concert.venue?.name || "Concert";
  const hasNextConcert = getUpcomingConcertsByArtist(ticketmaster.events, artistName).length > 0;
  // Next Concert some sem show futuro, porque o card dele fica vazio.
  const sections = SECTIONS.filter(([id]) => hasNextConcert || id !== "next-concert");
  const scrollToSection = (id) =>
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });

  return (
    <>
      <SEOHead
        title={`${artistName} - ${concertVenue} - ${concertDate}`}
        description={`Setlist and details for ${artistName} at ${concertVenue} on ${concertDate}. Explore songs performed and concert information.`}
        image={artistImage}
        url={`/artists/${artistId}/concerts/${concertId}`}
      />
      {/* O container das rotas no App.jsx é flex em linha; sem este wrapper o índice
          vira uma coluna ao lado da página em vez de uma faixa em cima dela. */}
      <div className="artist-page w-full min-w-0">
        <NearbyConcertBanner artist={artistName} events={ticketmaster.events} />
        {/* Dois grupos que podem quebrar linha em telas estreitas: metade de cima
            arredondada pra cima (7 títulos → 4 + 3; sem Next Concert, 3 + 3). */}
        <nav
          ref={menuRef}
          aria-label="Artist page sections"
          className="sticky top-16 z-10 lg:hidden flex w-full flex-col items-center justify-center gap-1 bg-zinc-100 p-4 text-sm sm:text-base text-zinc-800"
        >
          {[
            sections.slice(0, Math.ceil(sections.length / 2)),
            sections.slice(Math.ceil(sections.length / 2)),
          ].map((row, rowIndex) => (
            <div key={rowIndex} className="flex w-full flex-wrap justify-center gap-1">
              {row.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="flex shrink-0 items-center justify-center px-2 py-0.5 rounded-full border border-zinc-300 text-[12px] leading-4 text-zinc-500 whitespace-nowrap transition-colors hover:border-red-600 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="w-full mx-auto p-0 sm:px-6 sm:py-4 space-y-4">
          {/* Mesmo palco zinc da Home: foto e nome do artista em destaque (DESIGN.md). */}
          <div
            id="artist"
            className="min-w-0 scroll-mt-16 bg-zinc-100 px-6 pb-4 pt-0 lg:pt-4 sm:-mx-6 sm:-mt-4 flex-1 space-y-2"
          >
            <ArtistInfo
              key={artistId}
              concert={concert}
              setlist={setlist}
              attraction={attraction}
            />
          </div>

          <ConcertTabs
            concert={concert}
            setlist={setlist}
            ticketmaster={ticketmaster}
            fallbackImage={artistImage}
          />

          <div className="artist-card-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-w-0 bg-white px-4 space-y-2">
              <Setlist
                key={concert.id}
                concert={concert}
                setlist={setlist}
                ticketmaster={ticketmaster}
                fallbackImage={artistImage}
              />
            </div>

            <div
              id="top-tracks"
              className="min-w-0 scroll-mt-20 px-4 lg:flex lg:flex-col before:hidden spotify-player-card"
            >
              <Player attraction={attraction} />
              <Albums artistId={artistId} artist={artistName} className="pt-4 lg:hidden" />
            </div>

            {/* Desktop: uma fileira só, abaixo de Setlists e Top Tracks. No mobile fica sob o player. */}
            <Albums
              artistId={artistId}
              artist={artistName}
              className="hidden px-4 lg:col-span-2 lg:block"
            />
          </div>

          {/* Sem artist-card-grid: nem divisória entre Past e Upcoming, nem linha em cima. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="past-concerts" className="min-w-0 scroll-mt-20 bg-white px-4 space-y-2">
              <PastConcerts concert={concert} setlist={setlist} artistId={artistId} />
            </div>

            <div
              id="upcoming-concerts"
              className="min-w-0 scroll-mt-20 bg-white px-4 pb-4 space-y-2"
            >
              <UpcomingConcerts ticketmaster={ticketmaster} setlist={setlist} concert={concert} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
