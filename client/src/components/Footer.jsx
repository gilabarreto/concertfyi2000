import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

import {
  faInstagram,
  faFacebookF,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-red-600 shadow z-20">
      <footer className="mx-[1%] flex items-center justify-between px-6 py-4 text-white font-sans">
        <span className="text-sm tracking-tight">
          © 2025 concertfyi. all rights reserved.
        </span>

        <div className="flex text-xs sm:text-sm items-center gap-3">
          <a href="#" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
          <a href="#" aria-label="Facebook">
            <FontAwesomeIcon icon={faFacebookF} size="2x" />
          </a>
          <button
            onClick={() => navigate("/contact")}
            aria-label="Contact"
            className="bg-none border-none cursor-pointer text-white hover:opacity-80 transition-opacity"
          >
            <FontAwesomeIcon icon={faEnvelope} size="2x" />
          </button>
        </div>
      </footer>
    </div>
  );
}
