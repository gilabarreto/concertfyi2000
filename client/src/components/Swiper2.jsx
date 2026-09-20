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
import { Swiper as Coverflow, SwiperSlide } from "swiper/react";
import { A11y, EffectCoverflow, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/a11y";
import "./Swiper2.css";
import { AppContext } from "../context/AppContext";
import LocationSelector from "./LocationSelector";

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const subscribeMotion = (notify) => {
  motionPreference.addEventListener("change", notify);
  return () => motionPreference.removeEventListener("change", notify);
};
const getReducedMotion = () => motionPreference.matches;

export default function Swiper2() {
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
  const swiperRef = useRef(null);
  const reduceMotion = useSyncExternalStore(subscribeMotion, getReducedMotion);

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
    if (step < 0) swiperRef.current?.slidePrev();
    else swiperRef.current?.slideNext();
  };

  const activeSlide = slides[active];
  const [year, month, day] = (activeSlide?.date || "").split("-").map(Number);
  const concertDate =
    year && month && day ? dateLabel(new Date(year, month - 1, day)) : "Date to be announced";

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
            {slides.length > 0 && (
              <Coverflow
                key={slides.map((slide) => slide.eventId).join(",")}
                className="swiper2"
                modules={[EffectCoverflow, Keyboard, A11y]}
                effect="coverflow"
                centeredSlides
                slidesPerView="auto"
                initialSlide={Math.floor(slides.length / 2)}
                speed={reduceMotion ? 0 : 200}
                grabCursor
                keyboard={{ enabled: true, onlyInViewport: true }}
                a11y={{
                  containerMessage: "Upcoming concerts",
                  itemRoleDescriptionMessage: "concert",
                }}
                coverflowEffect={{
                  rotate: 55,
                  stretch: "45%",
                  depth: 180,
                  modifier: 1,
                  slideShadows: false,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => setActive(swiper.activeIndex)}
              >
                {slides.map((slide, index) => {
                  const image =
                    Math.abs(index - active) <= 3 ? getBestImage(slide.images, 1024) : null;
                  return (
                    <SwiperSlide key={slide.eventId}>
                      <button
                        type="button"
                        tabIndex={index === active ? 0 : -1}
                        aria-label={
                          index === active ? `Open ${slide.artistName}` : `Show ${slide.artistName}`
                        }
                        onClick={() => {
                          if (!swiperRef.current?.allowClick) return;
                          if (index === active) setSelectedArtist(slide);
                          else swiperRef.current?.slideTo(index);
                        }}
                        className="block aspect-video w-full overflow-hidden rounded-xl bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        {image && (
                          <img
                            src={image}
                            alt=""
                            className="size-full object-cover"
                            draggable="false"
                          />
                        )}
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Coverflow>
            )}
            {activeSlide && (
              <div className="mx-auto w-full sm:w-[80%] md:w-[60%] lg:w-[40%] grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 pt-3 text-black font-sans">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  disabled={active === 0}
                  className="disabled:opacity-30 disabled:cursor-not-allowed min-h-11 text-6xl text-red-600 px-1 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
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
                  disabled={active === slides.length - 1}
                  className="disabled:opacity-30 disabled:cursor-not-allowed min-h-11 text-6xl text-red-600 px-1 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
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
