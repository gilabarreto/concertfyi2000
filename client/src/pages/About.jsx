import { Link } from "react-router-dom";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faFacebookF } from "@fortawesome/free-brands-svg-icons";
import Icon from "../components/Icon";
import { SEOHead } from "../components/SEOHead";

export default function About() {
  return (
    <>
      <SEOHead
        title="About concertfyi"
        description="Learn about concertfyi - your backstage pass to live music. Discover concert history, setlists, and upcoming shows."
        url="/about"
      />
      <div className="w-full bg-red-600 flex flex-col items-center justify-evenly p-6">
        <div className="text-[10rem] font-medium tracking-tight leading-tight text-center overflow-hidden">
          {"{"}
          <span className="font-semibold text-zinc-100">fyi</span>
          {"}"}
        </div>

        <div className="w-full max-w-[350px] sm:max-w-[450px]">
          <div className="[&>span]:block w-full text-pretty text-white text-base sm:text-lg py-6 flex justify-center items-center">
            <span>
              <span className="font-semibold">Concertfyi</span> is your backstage pass to your
              favorite artist’s world. From past setlists to upcoming dates, hidden venues to
              sold-out arenas — find it all here. Explore concert history, discover what’s next, and
              connect with the music that moves you. The ultimate guide for true fans.
            </span>
          </div>
          <div className="mt-6 flex items-center justify-between gap-2 text-white font-sans">
            <span className="whitespace-nowrap text-xs sm:text-sm">
              © 2025 concertfyi. all rights reserved.
            </span>
            <div className="flex shrink-0 text-xs sm:text-sm items-center gap-2 sm:gap-3">
              <a href="#" aria-label="Instagram">
                <Icon icon={faInstagram} size="2x" />
              </a>
              <a href="#" aria-label="Facebook">
                <Icon icon={faFacebookF} size="2x" />
              </a>
              <Link
                to="/contact"
                aria-label="Contact"
                className="hover:opacity-80 transition-opacity"
              >
                <Icon icon={faEnvelope} size="2x" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
