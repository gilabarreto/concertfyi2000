import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-red-600 shadow z-20">
      <footer className="mx-[1%] flex items-center justify-between px-6 py-4 text-center text-white font-sans">
        © 2025 concertfyi. all rights reserved.
        <div className="flex items-center gap-6">
          <FontAwesomeIcon icon="fa-brands fa-instagram" size="2x" />
          <FontAwesomeIcon icon="fa-brands fa-facebook-f" size="2x" />
          <FontAwesomeIcon icon={faEnvelope} size="2x" />
        </div>
      </footer>
    </div>
  );
}
