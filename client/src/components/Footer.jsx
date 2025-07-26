import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

import {
  faInstagram,
  faFacebookF,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-red-600 shadow z-20">
      <footer className="mx-[1%] flex items-center justify-between px-6 py-4 text-white font-sans">
        <span className="text-sm sm:text-base tracking-tight">
          © 2025 concertfyi. all rights reserved.
        </span>

        <div className="flex items-center gap-6">
          <a href="#" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
          <a href="#" aria-label="Facebook">
            <FontAwesomeIcon icon={faFacebookF} size="2x" />
          </a>
          <a href="/contact" aria-label="Contact">
            <FontAwesomeIcon icon={faEnvelope} size="2x" />
          </a>
        </div>
      </footer>
    </div>
  );
}
