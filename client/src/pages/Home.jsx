import { lazy, Suspense, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import ReminderClose from "../components/ReminderClose";
import ReminderDelete from "../components/ReminderDelete";
import Swiper from "../components/Swiper";
import { SEOHead } from "../components/SEOHead";
import { useCurrentCity } from "../hooks/useCurrentCity";
import { useCitySetlists, useLocalEvents, useRecentSetlists } from "../api/queries";
import { dateLabel, getRecentUpcomingSetlists } from "../helpers/selectors";

import { useT } from "../i18n";
// Below the fold, and it pulls the ticket/hotel/reminder panels in with it: loading it on
// demand keeps those out of the entry chunk (CONSTRAINTS.md, 270 kB ceiling).
const HomeDiscovery = lazy(() => import("../components/HomeDiscovery"));

const Home = () => {
  const t = useT();
  const location = useCurrentCity();
  const { data: recentData } = useRecentSetlists(location.city, location.countryCode);
  // HomeDiscovery's two queries, started here with the same keys so they load alongside its
  // lazy chunk instead of after it; React Query hands HomeDiscovery the same requests.
  useLocalEvents(location.lat, location.long);
  useCitySetlists(location.city, location.countryCode, new Date().getFullYear());
  const recent = getRecentUpcomingSetlists(
    recentData?.setlist,
    location.city,
    location.countryCode,
  )[0];
  const reminderId = recent ? `home-recent-${recent.id}` : null;
  const {
    setConcertReminder,
    reminderOpen,
    setReminderOpen,
    reminderInteracted,
    setReminderInteracted,
    setReminderSeen,
  } = useContext(AppContext);
  useEffect(() => {
    setConcertReminder(
      reminderId ? { id: reminderId, pathname: "/", targetId: "home-reminder" } : null,
    );
    setReminderOpen(false);
    setReminderSeen(false);
    setReminderInteracted(false);
    return () => setConcertReminder(null);
  }, [reminderId, setConcertReminder, setReminderOpen, setReminderInteracted, setReminderSeen]);

  useEffect(() => {
    if (reminderInteracted || !reminderId) return;
    let closeTimer;
    const openTimer = setTimeout(() => {
      setReminderOpen(true);
      closeTimer = setTimeout(() => setReminderOpen(false), 5000);
    }, 10000);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [reminderId, reminderInteracted, setReminderOpen]);

  return (
    <>
      <SEOHead
        title={t("Discover Live Music & Concerts")}
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
                  {recent && (
                    <Link
                      to={`/artists/${recent.artist.mbid}/concerts/${recent.id}`}
                      className="hover:opacity-80"
                    >
                      <span className="font-semibold">{t("Recently added:")}</span>{" "}
                      {recent.artist.name}, {dateLabel(recent.dateObj)}
                      {" at "}
                      {recent.venue?.name || "Venue to be announced"}
                    </Link>
                  )}
                </p>
                <ReminderDelete />
                <ReminderClose />
              </div>
            </div>
          </div>
          {/* Palco do Cover Flow: faixa zinc de ponta a ponta da coluna (DESIGN.md). */}
          <div className="w-full shrink-0 stage px-4 pt-4 pb-2">
            <Swiper />
          </div>
        </div>

        <div className="w-[calc(100%+2rem)] min-w-0 -mx-4 sm:px-6">
          <Suspense fallback={null}>
            <HomeDiscovery location={location} />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default Home;
