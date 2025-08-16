import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalEvents, useArtistData } from "../api/queries";
import { getBestImage } from "../helpers/selectors";
import { useGeolocation } from "../hooks/useGeolocation";
import useIsSmallScreen from "../hooks/useScreenSize";

const SPACING = 120;
const SCALE_FACTOR_DESKTOP = 0.2;
const SCALE_FACTOR_MOBILE = 0.15;
const VERTICAL_SHIFT_MOBILE = 10;

function getSlideStyle(offset, depth, image, isSmallScreen) {
  const transform =
    offset === 0
      ? "none"
      : isSmallScreen
        ? `scale(${1 - SCALE_FACTOR_MOBILE * depth}) translateY(${depth * VERTICAL_SHIFT_MOBILE
        }px)`
        : `translateX(${offset * SPACING}px) scale(${1 - SCALE_FACTOR_DESKTOP * depth
        }) perspective(24px) rotateY(${offset > 0 ? -1 : 1}deg)`;

  return {
    transform,
    zIndex: 10 - depth,
    filter: offset === 0 ? "none" : "blur(3px)",
    opacity: offset === 0 ? 1 : depth > 2 ? 0 : 0.6,
    background: `url(${image}) center/cover no-repeat`,
  };
}

export default function Swiper({ setSetlist, setTicketmaster }) {
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [city, setCity] = useState();
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isSmallScreen = useIsSmallScreen();

  const { coords = { lat: -23.5505, long: -46.6333 } } = useGeolocation();
  const { data: localEventsData } = useLocalEvents(coords?.lat, coords?.long, {
    enabled: !!coords
  }); const { data: artistData, refetch: fetchArtistData } = useArtistData(selectedArtist?.artistName, {
    enabled: false,
  });

  const fallback = "/client/src/icons/logo.png";

  useEffect(() => {
    if (selectedArtist) {
      setIsLoading(true);
      handleSlideClick(selectedArtist)
    }
  }, [selectedArtist]);

  useEffect(() => {
    if (artistData) {
      const { setlist, ticketmaster } = artistData;
      setSetlist(setlist);
      setTicketmaster(ticketmaster);
    }
  }, [artistData, setSetlist, setTicketmaster]);

  useEffect(() => {
    if (localEventsData) {
      const events = localEventsData._embedded?.events || [];
      const eventsWithArtists = events.filter(
        (ev) => ev._embedded?.attractions?.[0]?.name
      );

      const uniqueArtists = [];
      const seenArtists = new Set();

      for (const ev of eventsWithArtists) {
        const artistName = ev._embedded.attractions[0].name;
        if (!seenArtists.has(artistName)) {
          seenArtists.add(artistName);
          uniqueArtists.push(ev);
        }
      }

      const shuffled = [...uniqueArtists].sort(() => Math.random() - 0.5);
      const list = shuffled.map((ev) => ({
        eventId: ev.id,
        artistId: ev._embedded.attractions[0].id,
        artistName: ev._embedded.attractions[0].name,
        title: ev.name,
        date: ev.dates.start.localDate,
        images: ev.images || [],
      }));

      setSlides(list);
      setActive(Math.floor(list.length / 2));
    }
  }, [localEventsData]);

  useEffect(() => {
    if (city) {
      setCity(city);
    }
  }, [city, setCity]);


  const handleSlideClick = async (slide) => {
    try {
      const response = await fetchArtistData();

      if (!response.data) {
        throw new Error("No data received");
      }

      const { setlist = [], ticketmaster = {} } = response.data;

      if (!setlist.length) {
        alert(`No setlist data found for ${slide.artistName}`);
        return;
      }

      const match = setlist.find((item) => item.eventDate === slide.date);
      const targetId = match?.id || setlist[0]?.id;
      const correctArtistId = setlist[0]?.artist?.mbid || slide.artistId;

      setSetlist(setlist);
      setTicketmaster(ticketmaster);

      navigate(`/artists/${correctArtistId}/concerts/${targetId}`, {
        state: { artistImage: slide.image },
      });
    } catch (err) {
      console.error("Error handling slide click:", err);
      alert(`Error loading data for ${slide.artistName}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const Slide = ({ slide, index }) => {
    const offset = index - active;
    const depth = Math.abs(offset);
    const image = getBestImage(slide.images) || slide.image || fallback;
    const style = getSlideStyle(offset, depth, image, isSmallScreen);

    return (
      <div
        key={slide.eventId}
        onClick={() => setSelectedArtist(slide)}
        className="group absolute -translate-x-1/2 aspect-video rounded-xl overflow-hidden
                transition-all duration-300 cursor-pointer w-[100%] sm:w-[80%] md:w-[60%] lg:w-[40%] z-0"
        style={style}
      >
        <div className="absolute inset-0 aspect-video rounded-xl overflow-hidden bg-red-600 bg-opacity-0 flex items-end p-6 transition duration-300 border-4 border-solid border-transparent hover:border-zinc-800 group-hover:bg-opacity-80 pointer-events-auto z-20">
          {offset === 0 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => Math.max(a - 1, 0));
                }}
                aria-label="Previous"
                className="absolute top-1/2 -translate-y-1/2 left-2 text-red-600 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] group-hover:text-zinc-800 text-9xl p-2 z-30 cursor-pointer pointer-events-auto"
              >
                {"{"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => Math.min(a + 1, slides.length - 1));
                }}
                aria-label="Next"
                className="absolute top-1/2 -translate-y-1/2 right-2 text-red-600 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] group-hover:text-zinc-800 text-9xl p-2 z-30 cursor-pointer pointer-events-auto"
              >
                {"}"}
              </button>
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <h3 className="text-4xl font-bold text-white text-center px-4 [text-shadow:_0_2px_8px_rgba(0,0,0,0.8)] sm:text-5xl">
              {slide.artistName}
            </h3>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Loading artist data...</p>
          </div>
        </div>
      )}

      <div className="relative w-full [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] h-[250px] sm:h-[380px] flex items-center justify-center overflow-hidden">
        {slides.map((slide, i) => (
          <Slide key={slide.eventId} slide={slide} index={i} />
        ))}
      </div>

    </>
  );
}