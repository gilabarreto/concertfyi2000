import { useState, useEffect, useContext } from "react";
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
    transform: isSmallScreen
      ? `scale(${1 - SCALE_FACTOR_MOBILE * scaleDepth}) translateY(${scaleDepth * VERTICAL_SHIFT_MOBILE}px)`
      : `translateX(${clampedOffset * SPACING}px) scale(${1 - SCALE_FACTOR_DESKTOP * scaleDepth}) perspective(24px) rotateY(${offset > 0 ? -1 : 1}deg)`,
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

  // Controls stay mounted outside the animated slides, preserving keyboard focus.
  const go = (step) => {
    setActive((current) => Math.min(Math.max(current + step, 0), slides.length - 1));
  };

  const activeSlide = slides[active];
  const [year, month, day] = (activeSlide?.date || "").split("-").map(Number);
  const concertDate =
    year && month && day ? dateLabel(new Date(year, month - 1, day)) : "Date to be announced";

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

    return (
      <div
        key={slide.eventId}
        onClick={() => setSelectedArtist(slide)}
        className={`group ${offset === 0 ? "relative" : "absolute top-0"} rounded-xl
                transition-[transform,opacity] duration-300 cursor-pointer w-[100%] sm:w-[80%] md:w-[60%] lg:w-[40%] z-0`}
        style={{ ...style, background: undefined }}
      >
        <div className="relative aspect-video rounded-xl" style={{ background: style.background }}>
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-red-600 bg-opacity-0 flex items-end p-6 transition border-4 border-solid border-transparent hover:border-zinc-800 hover:bg-opacity-80 pointer-events-auto z-20"></div>
        </div>
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
          <div className="relative w-full">
            <div className="relative w-full flex items-start justify-center overflow-clip">
              {slides.map(renderSlide)}
            </div>
            {activeSlide && (
              <div className="mx-auto w-full sm:w-[80%] md:w-[60%] lg:w-[40%] grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 pt-3 text-black font-sans">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="min-h-11 text-6xl text-red-600 px-1 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                >
                  {"{"}
                </button>
                <div className="min-w-0 flex flex-col items-center gap-1">
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
                  className="min-h-11 text-6xl text-red-600 px-1 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
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
