import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import LastConcert from "./LastConcert";
import NextConcert from "./NextConcert";
import "./ConcertTabs.css";

const tabs = [
  { id: "last-concert", label: "Last Concert" },
  { id: "next-concert", label: "Next Concert" },
];

export default function ConcertTabs({ concert, setlist, ticketmaster }) {
  const location = useLocation();
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [active, setActive] = useState(() =>
    location.state?.scrollTo === "next-concert" || new URLSearchParams(location.search).has("next")
      ? 1
      : 0,
  );
  const tabRefs = useRef([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const scrollToNext = location.state?.scrollTo === "next-concert";
    if (scrollToNext || new URLSearchParams(location.search).has("next")) setActive(1);
    if (!scrollToNext) return;
    const frame = requestAnimationFrame(() => {
      const target = desktop ? sectionRef.current : document.getElementById("next-concert");
      target?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.search, location.state, desktop]);

  const handleKeyDown = (event) => {
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - active;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section
      ref={sectionRef}
      className="concert-tabs scroll-mt-20"
      style={{ "--active-tab": active }}
    >
      {desktop && (
        <div
          role="tablist"
          aria-label="Concert details"
          className="concert-tab-list"
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => (tabRefs.current[index] = element)}
              type="button"
              role="tab"
              id={`${tab.id}-tab`}
              aria-controls={tab.id}
              aria-selected={active === index}
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              className="concert-tab"
            >
              {tab.label}
            </button>
          ))}
          <span aria-hidden="true" className="concert-tab-underline" />
        </div>
      )}
      <div className="concert-tab-panels">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            id={tab.id}
            role={desktop ? "tabpanel" : undefined}
            aria-labelledby={desktop ? `${tab.id}-tab` : undefined}
            aria-hidden={desktop && active !== index ? true : undefined}
            inert={desktop && active !== index ? "" : undefined}
            tabIndex={desktop && active === index ? 0 : undefined}
            className="concert-tab-panel min-w-0 scroll-mt-20 bg-white p-6 space-y-2"
            data-active={active === index}
            style={{ "--panel-index": index }}
          >
            {index === 0 ? (
              <LastConcert concert={concert} setlist={setlist} hideTitle={desktop} />
            ) : (
              <NextConcert
                concert={concert}
                setlist={setlist}
                ticketmaster={ticketmaster}
                hideTitle={desktop}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
