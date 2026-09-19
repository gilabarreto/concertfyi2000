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
      <div className="w-full bg-red-600 flex flex-col items-center justify-between p-6">
        <div className="text-[150px] sm:text-[200px] [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)] font-medium tracking-tight items-center text-center overflow-hidden text-balance">
          {"{"}
          <span className="text-[150px] sm:text-[200px] [text-shadow:_0_4px_12px_rgba(0,0,0,0.5)] tracking-tight font-semibold text-zinc-100">
            fyi
          </span>
          {"}"}
        </div>

        <div className="w-full max-w-[350px] sm:max-w-[450px]">
          <div className="[&>span]:block w-full text-justify text-white font-medium tracking-tight bg-red-600 rounded-2xl [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] p-6 flex justify-center items-center">
            <span>
              <span className="text-base sm:text-lg font-semibold">Concertfyi</span> is your
              backstage pass to your favorite artist’s world. From past setlists to upcoming dates,
              hidden venues to sold-out arenas — find it all here. Explore concert history, discover
              what’s next, and connect with the music that moves you. The ultimate guide for true
              fans.
            </span>
          </div>
          <div className="mt-6 flex items-center justify-between gap-2 text-white font-sans">
            <span className="whitespace-nowrap text-[10px] sm:text-sm tracking-tight">
              © 2025 concertfyi. all rights reserved.
            </span>
            <div className="flex shrink-0 text-[10px] sm:text-sm items-center gap-2 sm:gap-3">
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
