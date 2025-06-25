import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLocalEvents, getSetlist, getTicketmaster } from "../api/api";
import { getBestImage } from "../helpers/selectors";

const DEFAULT_COORDS = { lat: 49.2827, long: -123.1207 };
const SPACING = 120;
const SCALE_FACTOR_DESKTOP = 0.2;
const SCALE_FACTOR_MOBILE = 0.15;
const VERTICAL_SHIFT_MOBILE = 10;

function useIsSmallScreen(breakpoint = 768) {
  const [isSmall, setIsSmall] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isSmall;
}

function getSlideStyle(offset, depth, image, isSmallScreen) {
  const transform =
    offset === 0
      ? "none"
      : isSmallScreen
        ? `scale(${1 - SCALE_FACTOR_MOBILE * depth}) translateY(${depth * VERTICAL_SHIFT_MOBILE}px)`
        : `translateX(${offset * SPACING}px) scale(${1 - SCALE_FACTOR_DESKTOP * depth}) perspective(24px) rotateY(${offset > 0 ? -1 : 1}deg)`;

  return {
    transform,
    zIndex: 10 - depth,
    filter: offset === 0 ? "none" : "blur(3px)",
    opacity: offset === 0 ? 1 : depth > 2 ? 0 : 0.6,
    background: `url(${image}) center/cover no-repeat`,
  };
}

export default function Swiper({ setSetlist, setTicketmaster, setCity }) {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const navigate = useNavigate();
  const isSmallScreen = useIsSmallScreen();

  const fallback = "/client/src/icons/logo.png";

  // Geolocalização ou fallback Vancouver
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCoords({ lat: latitude, long: longitude });
        setLocationLoaded(true);
      },
      () => {
        setCoords(DEFAULT_COORDS);
        setLocationLoaded(true);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Busca eventos pela localização
  useEffect(() => {
    const { lat, long } = coords;

    if (lat === DEFAULT_COORDS.lat && long === DEFAULT_COORDS.long) return;

    console.log("📍 Buscando eventos para coordenadas:", lat, long);

    getLocalEvents(lat, long)
      .then(({ data }) => {
        const events = data._embedded?.events || [];
        const list = events.map((ev) => ({
          eventId: ev.id,
          artistId: ev._embedded.attractions?.[0]?.id || ev.id,
          artistName: ev._embedded.attractions?.[0]?.name || "",
          title: ev.name,
          date: ev.dates.start.localDate,
          images: ev.images || [],
        }));

        setSlides(list);
        setActive(Math.floor(list.length / 2));
      })
      .catch((err) => console.error("Erro ao buscar eventos:", err));
  }, [coords]);

  useEffect(() => {
    if (!locationLoaded || coords.lat === DEFAULT_COORDS.lat) return;

    const fetchCity = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.long}`
        );
        const data = await res.json();
        const location =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county;
        setCity(location || "Unknown");
      } catch (err) {
        console.error("Erro ao obter cidade:", err);
        setCity("Unavailable");
      }
    };

    fetchCity();
  }, [coords]);

  const handleSlideClick = async (slide) => {
    try {
      const [slRes, tmRes] = await Promise.all([
        getSetlist(slide.artistName),
        getTicketmaster(slide.artistName),
      ]);

      const fetchedSetlist = slRes.data.setlist || [];
      const fetchedTM = {
        attractions: tmRes.data._embedded?.attractions || [],
        events: tmRes.data._embedded?.events || [],
      };

      const match = fetchedSetlist.find(
        (item) => item.eventDate === slide.date
      );
      const targetId = match?.id || fetchedSetlist[0]?.id;

      const correctArtistId = fetchedSetlist[0]?.artist?.mbid || slide.artistId;

      setSetlist(fetchedSetlist);
      setTicketmaster(fetchedTM);

      navigate(`/artists/${correctArtistId}/concerts/${targetId}`, {
        state: { artistImage: slide.image },
      });
    } catch (err) {
      console.error("Erro ao preparar navegação:", err);
    }
  };

  return (
    <>
      <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] flex items-center justify-center overflow-hidden">

        <h1 className="absolute text-4xl top-0 md:text-5xl font-bold text-center text-gray-800 tracking-tight">
          Live Music Lives Here.
        </h1>

        <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] flex items-center justify-center overflow-hidden">

          {slides.map((slide, i) => {
            const offset = i - active;
            const depth = Math.abs(offset);
            const image = getBestImage(slide.images) || slide.image || fallback;
            const style = getSlideStyle(offset, depth, image, isSmallScreen);

            return (
              <div
                key={slide.eventId}
                onClick={() => handleSlideClick(slide)}
                className="group absolute -translate-x-1/2 aspect-video rounded-xl overflow-hidden
  border-4 border-transparent border-solid transition-all duration-300
  border-zinc-800 cursor-pointer w-[100%] sm:w-[80%] md:w-[60%] lg:w-[40%]"
                style={style}
              >
                <div className="absolute inset-0 bg-red-600 bg-opacity-0 flex items-end p-6 transition duration-300 group-hover:bg-opacity-80 pointer-events-none">
                  {offset === 0 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActive((a) => Math.max(a - 1, 0));
                        }}
                        aria-label="Previous"
                        className="absolute top-1/2 -translate-y-1/2 left-2 text-red-600 group-hover:text-zinc-800 text-9xl p-2 z-30 cursor-pointer pointer-events-auto"
                      >
                        {"{"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActive((a) => Math.min(a + 1, slides.length - 1));
                        }}
                        aria-label="Next"
                        className="absolute top-1/2 -translate-y-1/2 right-2 text-red-600 group-hover:text-zinc-800 text-9xl p-2 z-30 cursor-pointer pointer-events-auto"
                      >
                        {"}"}
                      </button>
                    </>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <h3 className="text-6xl font-bold text-white text-center px-4">
                      {slide.artistName}
                    </h3>
                  </div>

                </div>
              </div>
            );
          })}

        </div>
      </div>
      <div className="relative bottom-0 w-full text-3xl font-bold text-center text-gray-800 tracking-tight overflow-hidden">
        <h1>
          Track your favorite artists, explore past performances, and never miss
          a show again.
        </h1>
      </div>
    </>
  );
}
