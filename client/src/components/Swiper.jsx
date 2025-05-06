// Swiper.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLocalEvents, getSetlist, getTicketmaster } from "../api/api";
import { getBestImage } from "../helpers/selectors";

const DEFAULT_COORDS = { lat: 49.2827, long: -123.1207 };

export default function Swiper({ setSetlist, setTicketmaster }) {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  const fallback = "/client/src/icons/logo.png";

  // Geolocalização ou fallback Vancouver
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) =>
        setCoords({ lat: latitude, long: longitude }),
      () => setCoords(DEFAULT_COORDS),
      { enableHighAccuracy: true }
    );
  }, []);

  // Busca eventos pela localização
  useEffect(() => {
    const { lat, long } = coords;
    getLocalEvents(lat, long)
      .then(({ data }) => {
        let events = data._embedded?.events || [];
        if (lat === DEFAULT_COORDS.lat && long === DEFAULT_COORDS.long) {
          events = events.sort(() => Math.random() - 0.5);
        }
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
        {slides.map((slide, i) => {
          const offset = i - active;
          const depth = Math.abs(offset);
          const image = getBestImage(slide.images) || slide.image || fallback;
          const transform =
            offset === 0
              ? "none"
              : `translateX(${offset * 120}px) scale(${1 - 0.2 * depth}) perspective(16px) rotateY(${offset > 0 ? -1 : 1}deg)`;
          const style = {
            transform,
            zIndex: offset === 0 ? 1 : -depth,
            filter: offset === 0 ? "none" : "blur(5px)",
            opacity: offset === 0 ? 1 : depth > 2 ? 0 : 0.6,
            background: `url(${image}) center/cover no-repeat`,
          };
          return (
              <div
                key={slide.eventId}
                onClick={() => handleSlideClick(slide)}
                className="absolute -translate-x-1/2 w-[600px] aspect-video rounded-xl overflow-hidden border-4 border-transparent transition-all duration-300 hover:border-zinc-800 cursor-pointer"
                style={style}
              >
                <div className="absolute inset-0 bg-red-600 bg-opacity-0 flex items-end p-6 hover:bg-opacity-80 transition duration-300">
                  <h3 className="text-2xl font-bold text-white">
                    {slide.title}
                  </h3>
                </div>
              </div>
          );
        })}

        <button
          onClick={() => setActive((a) => Math.max(a - 1, 0))}
          className="absolute top-1/2 -translate-y-1/2 left-4 bg-gray-800 bg-opacity-50 text-white text-2xl p-2 rounded-full z-20 cursor-pointer"
        >
          ‹
        </button>

        <button
          onClick={() => setActive((a) => Math.min(a + 1, slides.length - 1))}
          className="absolute top-1/2 -translate-y-1/2 right-4 bg-gray-800 bg-opacity-50 text-white text-2xl p-2 rounded-full z-20 cursor-pointer"
        >
          ›
        </button>
        <h1 className="absolute bottom-0 mt-4 w-full text-xl md:text-2xl font-bold text-center text-gray-800 tracking-tight">
          Track your favorite artists, explore past performances, and never miss
          a show again.
        </h1>
      </div>
    </>
  );
}
