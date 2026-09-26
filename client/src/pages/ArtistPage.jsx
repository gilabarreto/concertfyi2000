import { useEffect, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useSetlistById, useArtistData } from "../api/queries";
import ArtistInfo from "../components/ArtistPage/ArtistInfo";
import ConcertTabs from "../components/ArtistPage/ConcertTabs";
import Setlist from "../components/ArtistPage/Setlist";
import Player from "../components/ArtistPage/Player";
import UpcomingConcerts from "../components/ArtistPage/UpcomingConcerts";
import PastConcerts from "../components/ArtistPage/PastConcerts";
import { AppContext } from "../context/AppContext";
import { getArtistAttraction, getUpcomingConcertsByArtist } from "../helpers/selectors";
import { SEOHead } from "../components/SEOHead";

export default function ArtistPage() {
  const { setlist = [], ticketmaster = {}, setSetlist, setTicketmaster } = useContext(AppContext);
  const { concertId, artistId } = useParams();
  const sectionsRef = useRef(null);

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
  // Índice do mobile: abaixo de lg as abas viram cards empilhados e a página fica longa.
  // Next Concert some sem show futuro, porque o card dele fica vazio.
  const sections = [
    ["artist", "Artist"],
    ["last-concert", "Last Concert"],
    hasNextConcert && ["next-concert", "Next Concert"],
    ["setlist", "Setlist"],
    ["top-tracks", "Top Tracks"],
    ["past-concerts", "Past"],
    ["upcoming-concerts", "Upcoming"],
  ].filter(Boolean);
  // As chaves só rolam a faixa, como as das miniaturas; ir até o card é clicar no título.
  const scrollSections = (direction) =>
    sectionsRef.current?.scrollBy({
      left: (direction * sectionsRef.current.clientWidth) / 2,
      behavior: "smooth",
    });
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
      <div className="w-full min-w-0">
        {/* Cores e fonte da faixa da Home; um par de chaves em volta dos títulos, como nas
            miniaturas (ArtistPhotos). Centralizado; se não couber, só os títulos rolam. */}
        <nav
          aria-label="Artist page sections"
          className="lg:hidden flex w-full items-center justify-center bg-red-600 p-4 text-sm sm:text-base text-white"
        >
          <button
            type="button"
            onClick={() => scrollSections(-1)}
            aria-label="Scroll sections left"
            className="shrink-0 -translate-y-px px-0.5 text-xl leading-none sm:text-[22px]"
          >
            {"{"}
          </button>
          {/* Sem barra de rolagem: no Windows ela ocupa espaço embaixo e empurra os títulos pra cima. */}
          <div
            ref={sectionsRef}
            className="flex min-w-0 gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="mx-2 shrink-0 text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollSections(1)}
            aria-label="Scroll sections right"
            className="shrink-0 -translate-y-px px-0.5 text-xl leading-none sm:text-[22px]"
          >
            {"}"}
          </button>
        </nav>
        <div className="w-full mx-auto p-0 sm:px-6 sm:py-4 space-y-4">
          {/* Mesmo palco zinc da Home: foto e nome do artista em destaque (DESIGN.md). */}
          <div
            id="artist"
            className="min-w-0 scroll-mt-16 bg-zinc-100 p-6 sm:-mx-6 sm:-mt-4 flex-1 space-y-2"
          >
            <ArtistInfo
              key={artistId}
              concert={concert}
              setlist={setlist}
              attraction={attraction}
            />
          </div>

          <ConcertTabs concert={concert} setlist={setlist} ticketmaster={ticketmaster} />

          <hr className="w-full sm:w-[95%] mx-auto border-zinc-300" />

          <div className="artist-card-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-w-0 bg-white p-4 space-y-2">
              <Setlist concert={concert} />
            </div>

            <div
              id="top-tracks"
              className="min-w-0 scroll-mt-20 p-4 before:hidden spotify-player-card"
            >
              <Player attraction={attraction} />
            </div>
          </div>

          <hr className="w-full sm:w-[95%] mx-auto border-zinc-300 past-section-divider" />

          <div className="artist-card-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="past-concerts" className="min-w-0 scroll-mt-20 bg-white p-4 space-y-2">
              <PastConcerts concert={concert} setlist={setlist} artistId={artistId} />
            </div>

            <div id="upcoming-concerts" className="min-w-0 scroll-mt-20 bg-white p-4 space-y-2">
              <UpcomingConcerts ticketmaster={ticketmaster} setlist={setlist} concert={concert} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
