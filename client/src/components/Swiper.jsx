import { useState, useEffect, useContext, useRef } from "react";
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

const SPACING = 120;
const SCALE_FACTOR_DESKTOP = 0.2;
const SCALE_FACTOR_MOBILE = 0.15;
const VERTICAL_SHIFT_MOBILE = 10;

function getSlideStyle(offset, depth, image, isSmallScreen) {
  const common = {
    zIndex: 10 - depth,
    // Sem imagem não põe background nenhum: slide invisível não baixa foto.
    ...(image ? { background: `url(${image}) center/cover no-repeat` } : null),
  };

  // O slide do meio é o caso especial: sem deslocamento, sem desfoque, opaco.
  if (offset === 0) return { ...common, transform: "none", filter: "none", opacity: 1 };

  return {
    ...common,
    transform: isSmallScreen
      ? `scale(${1 - SCALE_FACTOR_MOBILE * depth}) translateY(${depth * VERTICAL_SHIFT_MOBILE}px)`
      : `translateX(${offset * SPACING}px) scale(${1 - SCALE_FACTOR_DESKTOP * depth}) perspective(24px) rotateY(${offset > 0 ? -1 : 1}deg)`,
    filter: "blur(3px)",
    // Do terceiro vizinho em diante o slide já saiu de vista.
    opacity: depth > 2 ? 0 : 0.6,
  };
}

export default function Swiper() {
  const { setSetlist, setTicketmaster, selectedLocation } = useContext(AppContext);
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Limpa o selectedArtist junto: o effect só dispara quando ele muda, então
  // sem isso clicar de novo no mesmo slide depois de um erro não fazia nada.
  const dismissError = () => {
    setError(null);
    setSelectedArtist(null);
  };
  const navigate = useNavigate();
  const isSmallScreen = useIsSmallScreen();
  const carouselRef = useRef(null);
  const refocusNav = useRef(null);

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
  }, [localEventsData]);

  // Prev/Next live inside the centered slide, so after moving, focus the same control in the new center
  const go = (e, step) => {
    e.stopPropagation();
    const next = Math.min(Math.max(active + step, 0), slides.length - 1);
    if (next === active) return;
    refocusNav.current =
      document.activeElement === e.currentTarget ? e.currentTarget.dataset.nav : null;
    setActive(next);
  };

  useEffect(() => {
    if (!refocusNav.current) return;
    carouselRef.current?.querySelector(`[data-nav="${refocusNav.current}"]`)?.focus();
    refocusNav.current = null;
  }, [active]);

  // plain render function, not a component: a component declared inside Swiper would remount
  // every slide on each render, which killed the slide transition
  const renderSlide = (slide, index) => {
    const offset = index - active;
    const depth = Math.abs(offset);
    // Acima de depth 2 o slide está com opacity 0 — invisível, e ainda assim baixava
    // uma foto. Carrega até 3 para ter um anel de folga: quem desliza um slide já
    // encontra a imagem pronta, em vez de vê-la aparecer depois.
    // O slide é a foto de largura cheia da home; 1024 cobre celular em DPR alto.
    const image = depth <= 3 ? getBestImage(slide.images, 1024) : null;
    const style = getSlideStyle(offset, depth, image, isSmallScreen);
    const [year, month, day] = (slide.date || "").split("-").map(Number);
    const concertDate =
      year && month && day ? dateLabel(new Date(year, month - 1, day)) : "Date to be announced";

    return (
      <div
        key={slide.eventId}
        onClick={() => setSelectedArtist(slide)}
        className="group absolute -translate-x-1/2 aspect-video rounded-xl
                transition-[transform,opacity] duration-300 cursor-pointer w-[100%] sm:w-[80%] md:w-[60%] lg:w-[40%] z-0"
        style={style}
      >
        <div className="absolute inset-0 aspect-video rounded-xl overflow-hidden bg-red-600 bg-opacity-0 flex items-end p-6 transition border-4 border-solid border-transparent hover:border-zinc-800 group-hover:bg-opacity-80 pointer-events-auto z-20"></div>
        {offset === 0 && (
          <>
            <div className="absolute top-full left-0 w-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pt-3 text-black font-sans">
              <button
                type="button"
                onClick={(event) => go(event, -1)}
                data-nav="prev"
                aria-label="Previous"
                className="text-6xl text-red-600 px-1 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              >
                {"{"}
              </button>
              <div className="min-w-0 flex flex-col items-center gap-1">
                <h2 className="min-w-0 text-3xl font-bold text-balance text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArtist(slide);
                    }}
                    className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600"
                  >
                    {slide.artistName}
                  </button>
                </h2>
                <p className="text-base font-normal text-center">
                  {concertDate} @ {slide.venue || "Venue to be announced"}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => go(event, 1)}
                data-nav="next"
                aria-label="Next"
                className="text-6xl text-red-600 px-1 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
              >
                {"}"}
              </button>
            </div>
          </>
        )}
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
        <div className="w-full">
          <div ref={carouselRef} className="relative w-full">
            <div className="relative w-full h-[300px] sm:h-[390px] flex items-center justify-center overflow-visible">
              {slides.map(renderSlide)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
