import { useState, useEffect, useContext, useRef, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalEvents, useArtistData } from "../api/queries";
import {
  dateLabel,
  getBestImage,
  getCarouselSlides,
  getPastConcertsByArtist,
} from "../helpers/selectors";
import { useGeolocation } from "../hooks/useGeolocation";
import useIsSmallScreen from "../hooks/useScreenSize";
import { AppContext } from "../context/AppContext";
import LocationSelector from "./LocationSelector";
import "./Swiper.css";

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const subscribeMotion = (notify) => {
  motionPreference.addEventListener("change", notify);
  return () => motionPreference.removeEventListener("change", notify);
};
const getReducedMotion = () => motionPreference.matches;

// Distância dos cards que ficam atrás. Estes são os valores mais fáceis de testar:
// aumente para afastar os cards; diminua para deixá-los mais escondidos atrás do centro.
const SPACING_DESKTOP = 90;
const SPACING_TABLET = 105;
const SPACING_COMPACT = 0;
const ROTATION_DEGREES = 30;
const SCALE_FACTOR_DESKTOP = 0.2;
const SCALE_FACTOR_MOBILE = 0.15;
const VERTICAL_SHIFT_MOBILE = 10;

function getSlideStyle(offset, depth, image, isMobileScreen, spacing) {
  const common = {
    zIndex: 10 - Math.round(depth),
    // Sem imagem não põe background nenhum: slide invisível não baixa foto.
    ...(image ? { background: `url(${image}) center/cover no-repeat` } : null),
  };

  // Nem escala nem translateX têm teto: de puro depth/offset * fator, um slide muitas
  // posições do centro fica com escala negativa (vira espelho e infla a caixa — medido
  // scale(-1.85), 721px numa tela de 390px) ou some translateX afora (medido scrollWidth
  // 3026px num viewport de 1440px no desktop). Invisível (opacity 0), mas ainda conta no
  // scrollWidth da página. Trava os dois no mesmo depth 3 do anel de carregamento de
  // imagem: dali pra frente já está fora de vista, ir mais longe não muda nada visível.
  const scaleDepth = Math.min(depth, 3);
  const clampedOffset = Math.sign(offset) * scaleDepth;

  return {
    ...common,
    transform: isMobileScreen
      ? `translateX(${clampedOffset * SPACING_COMPACT}px) scale(${1 - SCALE_FACTOR_MOBILE * scaleDepth}) translateY(${scaleDepth * VERTICAL_SHIFT_MOBILE}px)`
      : `translateX(${clampedOffset * spacing}px) scale(${1 - SCALE_FACTOR_DESKTOP * scaleDepth}) perspective(600px) rotateY(${-Math.sign(offset) * ROTATION_DEGREES}deg)`,
    filter: `blur(${Math.min(depth, 1) * 3}px)`,
    // Fractional depth lets cards follow the gesture without changing their resting layout.
    opacity: depth <= 1 ? 1 - depth * 0.4 : Math.max(0, 0.6 * (3 - Math.max(2, depth))),
  };
}

export default function Swiper() {
  const { setSetlist, setTicketmaster, selectedLocation } = useContext(AppContext);
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const photosRef = useRef(null);
  const focusPhoto = useRef(false);
  const reduceMotion = useSyncExternalStore(subscribeMotion, getReducedMotion);

  useEffect(() => {
    if (!focusPhoto.current) return;
    photosRef.current
      ?.querySelector('[data-carousel-photo][tabindex="0"]')
      ?.focus({ preventScroll: true });
    focusPhoto.current = false;
  }, [active]);

  // Limpa o selectedArtist junto: o effect só dispara quando ele muda, então
  // sem isso clicar de novo no mesmo slide depois de um erro não fazia nada.
  const dismissError = () => {
    setError(null);
    setSelectedArtist(null);
  };
  const navigate = useNavigate();
  // Trata tablet e mobile como o modo compacto, para os cards laterais caberem na tela.
  const isMobileScreen = useIsSmallScreen(640);
  const isTabletScreen = useIsSmallScreen(1024);
  const slideSpacing = isMobileScreen
    ? SPACING_COMPACT
    : isTabletScreen
      ? SPACING_TABLET
      : SPACING_DESKTOP;

  const {
    coords = { lat: -23.5505, long: -46.6333 },
    city,
    country,
    isLoading: isGeoLoading,
  } = useGeolocation();

  const effectiveCoords = selectedLocation
    ? { lat: selectedLocation.lat, long: selectedLocation.lon }
    : coords;

  const { data: localEventsData } = useLocalEvents(effectiveCoords?.lat, effectiveCoords?.long);

  // Ticketmaster has no events near this city (e.g. Tokyo, Buenos Aires)
  const noEvents =
    localEventsData &&
    !localEventsData._embedded?.events?.some((ev) => ev._embedded?.attractions?.[0]?.name);

  // Só o refetch interessa: quem usa a resposta é o effect abaixo, que precisa dela
  // em ordem (guardar no contexto, depois navegar). `data` era lido por um segundo
  // effect que escrevia o mesmo no contexto — ver o commit que tirou isso.
  const { refetch: fetchArtistData } = useArtistData(selectedArtist?.artistName);

  // O clique só guarda o slide; o fetch mora aqui porque é a troca de
  // selectedArtist que muda a queryKey de useArtistData.
  useEffect(() => {
    if (!selectedArtist) return;

    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await fetchArtistData();

        if (!response.data) {
          throw new Error("No data received");
        }

        const { setlist = [], ticketmaster = {} } = response.data;

        if (!setlist.length) {
          setError(`No setlist found for ${selectedArtist.artistName}.`);
          return;
        }

        const correctArtistId = setlist[0]?.artist?.mbid || selectedArtist.artistId;
        const targetId = getPastConcertsByArtist(setlist, correctArtistId)[0]?.id || setlist[0]?.id;

        setSetlist(setlist);
        setTicketmaster(ticketmaster);

        navigate(`/artists/${correctArtistId}/concerts/${targetId}`);
      } catch (err) {
        console.error("Error handling slide click:", err);
        setError(`Couldn't load ${selectedArtist.artistName}. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedArtist, fetchArtistData, navigate, setSetlist, setTicketmaster]);

  useEffect(() => {
    if (!localEventsData) return;

    const list = getCarouselSlides(localEventsData);
    setSlides(list);
    setActive(Math.floor(list.length / 2));
    drag.current = null;
    setDragOffset(0);
  }, [localEventsData]);

  // Controls stay mounted outside the animated slides, preserving keyboard focus.
  const go = (step) => {
    // Depois de usar uma seta, devolve o foco ao card ativo. Isso mantém as
    // setas do teclado funcionando também quando o carrossel está numa extremidade.
    focusPhoto.current = true;
    setActive((current) => {
      const next = Math.max(0, Math.min(current + step, slides.length - 1));
      if (next === current) {
        requestAnimationFrame(() =>
          photosRef.current
            ?.querySelector('[data-carousel-photo]:not([tabindex="-1"])')
            ?.focus({ preventScroll: true }),
        );
      }
      return next;
    });
  };

  const startDrag = (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null };
    event.currentTarget.focus({ preventScroll: true });
  };

  const moveDrag = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
      gesture.axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }
    if (gesture.axis === "horizontal") {
      // Capture only a drag: an ordinary click still reaches the artist card.
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      const progress = Math.max(-1, Math.min(1, dx / slideSpacing));
      setDragOffset(Math.max(active - (slides.length - 1), Math.min(active, progress)));
    }
  };

  const endDrag = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    if (gesture.axis === "horizontal" && Math.abs(dx) >= 44) go(dx < 0 ? 1 : -1);
    drag.current = null;
    setDragOffset(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cancelDrag = () => {
    drag.current = null;
    setDragOffset(0);
  };

  const activeSlide = slides[active];
  const [year, month, day] = (activeSlide?.date || "").split("-").map(Number);
  const concertDate =
    year && month && day ? dateLabel(new Date(year, month - 1, day)) : "Date to be announced";

  // plain render function, not a component: a component declared inside Swiper would remount
  // every slide on each render, which killed the slide transition
  const renderSlide = (slide, index) => {
    const visualDrag = reduceMotion ? 0 : dragOffset;
    const offset = index - active + visualDrag;
    const depth = Math.abs(offset);
    // Acima de depth 2 o slide está com opacity 0 — invisível, e ainda assim baixava
    // uma foto. Carrega até 3 para ter um anel de folga: quem desliza um slide já
    // encontra a imagem pronta, em vez de vê-la aparecer depois.
    // O slide é a foto de largura cheia da home; 1024 cobre celular em DPR alto.
    const image = depth <= 3 ? getBestImage(slide.images, 1024) : null;
    const style = getSlideStyle(offset, depth, image, isMobileScreen, slideSpacing);

    return (
      <div
        key={slide.eventId}
        data-active={index === active}
        className={`group ${index === active ? "relative" : "absolute top-0"} rounded-xl
                transition-[transform,opacity] duration-300 motion-reduce:transition-none w-full sm:w-[76%] md:w-[58%] lg:w-[40%] z-0`}
        style={{
          ...style,
          transform: style.transform,
          background: undefined,
          pointerEvents: depth > 2 ? "none" : "auto",
          transitionDuration: reduceMotion || dragOffset !== 0 ? "0ms" : undefined,
        }}
      >
        <button
          type="button"
          data-carousel-photo
          tabIndex={index === active ? 0 : -1}
          aria-label={index === active ? `Open ${slide.artistName}` : `Show ${slide.artistName}`}
          onClick={() => {
            if (index === active) setSelectedArtist(slide);
            else setActive(index);
          }}
          className="swiper-photo relative block w-full aspect-video overflow-visible rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          style={{ background: style.background }}
        >
          <span className="swiper-photo-highlight absolute inset-0 rounded-xl bg-red-600 opacity-0 pointer-events-none" />
          {image && index === active && (
            <img
              src={image}
              alt=""
              aria-hidden="true"
              className="swiper-photo-reflection absolute left-0 top-[calc(100%-1px)] h-[45dvh] w-full rounded-b-xl object-fill pointer-events-none"
            />
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg text-sm">
            <p>Loading artist data...</p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={dismissError}
        >
          <div
            className="bg-white p-6 rounded-lg text-sm max-w-sm text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-zinc-800">{error}</p>
            <button
              onClick={dismissError}
              className="px-4 py-2 rounded-lg bg-red-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {noEvents ? (
        <div className="w-full h-[250px] sm:h-[380px] flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg text-zinc-800 text-pretty">No concerts found near</p>
          <LocationSelector city={city} country={country} isLoading={isGeoLoading} />
          <p className="text-sm text-gray-500 text-pretty">Pick another city to see what's on.</p>
        </div>
      ) : (
        <div
          className="original-swiper w-full"
          role="region"
          aria-roledescription="carousel"
          aria-label="Upcoming concerts"
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            focusPhoto.current = event.target.hasAttribute("data-carousel-photo");
            go(event.key === "ArrowLeft" ? -1 : 1);
          }}
        >
          <div className="relative w-full">
            <div
              ref={photosRef}
              tabIndex={0}
              role="group"
              aria-label="Concert photos. Use left and right arrow keys to browse."
              className="swiper-photo-stage relative w-full h-[calc((100vw-2rem)*0.5625)] sm:h-[calc((100vw-2rem)*0.4275)] md:h-[calc((100vw-2rem)*0.32625)] lg:h-[calc((100vw-2rem)*0.225)] flex items-start justify-center overflow-x-visible overflow-y-visible touch-pan-y select-none cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onLostPointerCapture={cancelDrag}
              onClickCapture={(event) => {
                if (!suppressClick.current || event.detail === 0) return;
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {slides.map(renderSlide)}
            </div>
            {activeSlide && (
              <div className="mx-auto w-full sm:w-[80%] md:w-[60%] lg:w-[40%] grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 pt-3 text-black font-sans">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  disabled={active === 0}
                  className="min-h-11 text-6xl text-red-600 px-1 enabled:hover:text-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                >
                  {"{"}
                </button>
                <div className="swiper-artist-info h-[104px] min-w-0 flex flex-col items-center gap-1 overflow-visible sm:h-[88px]">
                  <h2 className="min-w-0 text-3xl font-bold text-balance text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedArtist(activeSlide)}
                      className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600"
                    >
                      {activeSlide.artistName}
                    </button>
                  </h2>
                  <p className="text-base font-normal text-center text-pretty">
                    {concertDate} @ {activeSlide.venue || "Venue to be announced"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next"
                  disabled={active === slides.length - 1}
                  className="min-h-11 text-6xl text-red-600 px-1 enabled:hover:text-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                >
                  {"}"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
