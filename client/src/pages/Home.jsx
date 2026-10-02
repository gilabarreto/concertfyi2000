import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import ReminderClose from "../components/ReminderClose";
import ReminderDelete from "../components/ReminderDelete";
import Swiper from "../components/Swiper";
import { SEOHead } from "../components/SEOHead";
import { faBuilding, faCity, faLocationDot, faClock } from "@fortawesome/free-solid-svg-icons";
import Icon from "../components/Icon";
import { useCurrentCity } from "../hooks/useCurrentCity";

// Same pill as SHARE / I WAS THERE on the artist page.
const pill =
  "flex shrink-0 items-center gap-[4.8px] px-[9.6px] py-[2.4px] rounded-full border border-zinc-300 text-[14.4px] leading-[19.2px] text-zinc-500 whitespace-nowrap transition-colors hover:border-red-600 hover:text-red-600";

const Home = () => {
  const {
    setConcertReminder,
    reminderOpen,
    setReminderOpen,
    reminderInteracted,
    setReminderInteracted,
    setReminderSeen,
  } = useContext(AppContext);
  useEffect(() => {
    setConcertReminder({ id: "home-intro", pathname: "/", targetId: "home-reminder" });
    setReminderOpen(false);
    setReminderSeen(false);
    setReminderInteracted(false);
    return () => setConcertReminder(null);
  }, [setConcertReminder, setReminderOpen, setReminderInteracted, setReminderSeen]);

  useEffect(() => {
    if (reminderInteracted) return;
    let closeTimer;
    const openTimer = setTimeout(() => {
      setReminderOpen(true);
      closeTimer = setTimeout(() => setReminderOpen(false), 5000);
    }, 10000);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [reminderInteracted, setReminderOpen]);

  const { city } = useCurrentCity();

  return (
    <>
      <SEOHead
        title="Discover Live Music & Concerts"
        description="Track your favorite artists, explore past performances, and never miss a concert again. Find setlists, venues, and ticket information."
        url="/"
      />
      <div className="flex flex-col w-full flex-1 items-center gap-6 lg:gap-3 overflow-x-clip p-4">
        <div className="flex flex-col w-[calc(100%+2rem)] -mx-4 -mt-4 items-center">
          <div
            id="home-reminder"
            aria-hidden={!reminderOpen}
            inert={!reminderOpen ? "" : undefined}
            className={`grid w-full scroll-mt-16 transition-[grid-template-rows] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${reminderOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="relative bg-red-600">
                <p className="w-full bg-red-600 pl-[52px] pr-[72px] py-3 text-left lg:pl-[72px] lg:text-center text-sm sm:text-base text-white text-pretty">
                  Track your favorite artists, explore past performances and never miss a concert
                  again.
                </p>
                <ReminderDelete />
                <ReminderClose />
              </div>
            </div>
          </div>
          {/* Palco do Cover Flow: faixa zinc de ponta a ponta da coluna (DESIGN.md). */}
          <div className="w-full shrink-0 bg-zinc-100 shadow-[inset_0_-2px_4px_-2px_rgba(0,0,0,0.12)] px-4 pt-4 pb-2">
            <Swiper />
          </div>
        </div>

        <nav
          aria-label="Explore concerts"
          className="flex flex-wrap items-center justify-center gap-2 w-full"
        >
          <Link to="/venues" title={`Venues in ${city}`} className={pill}>
            <Icon icon={faBuilding} className="text-[0.78rem]" />
            VENUES
          </Link>
          <Link to="/city?view=upcoming" title={`Upcoming concerts in ${city}`} className={pill}>
            <Icon icon={faCity} className="text-[0.78rem]" />
            UPCOMING CONCERTS
          </Link>
          <Link
            to="/city?view=nearby"
            title={`Concerts in neighboring cities within 50 km of ${city}`}
            className={pill}
          >
            <Icon icon={faLocationDot} className="text-[0.78rem]" />
            CONCERTS NEAR {city.toUpperCase()}
          </Link>
          <Link
            to="/city?view=recent"
            title={`Upcoming concerts in ${city} announced for sale in the last 30 days}`}
            className={pill}
          >
            <Icon icon={faClock} className="text-[0.78rem]" />
            RECENTLY ADDED
          </Link>
        </nav>
      </div>
    </>
  );
};

export default Home;
