import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLocationDot } from "@fortawesome/free-solid-svg-icons";

function Navbar(props) {

  return (
    <div className="fixed top-0 left-0 w-full bg-white shadow z-20">
      <nav className="flex w-full justify-evenly items-center px-6 py-4 h-16 font-sans flex-wrap gap-2">
        <div>
          <Link
            to="/"
            className="text-3xl font-medium tracking-tight items-center"
            onClick={() => props.setValue("")}
          >
            <span className="hidden sm:inline">concert</span>
            <span className="text-3xl font-medium tracking-tight items-center">
              {"{"}
            </span>
            <span className="text-3xl tracking-tight font-bold text-red-600">
              fyi
            </span>
            <span className="text-3xl font-medium tracking-tight items-center">
              {"}"}
            </span>
          </Link>
        </div>

        <div className="hidden sm:block px-4 whitespace-nowrap">
          <FontAwesomeIcon
            className="text-2xl tracking-tight font-bold text-red-600 px-1"
            icon={faLocationDot}
          />
          <span className="text-2xl font-medium tracking-tight items-center">
            {props.city || "Locating..."}
          </span>
        </div>

        <div className="flex flex-1 mx-4">
          <SearchBar
            setSetlist={props.setSetlist}
            setTicketmaster={props.setTicketmaster}
            setLat={props.setLat}
            setLong={props.setLong}
            value={props.value}
            setValue={props.setValue}
          />
        </div>

        <div className="hamburger-menu">
          <div className="hamburger-icon" onClick={() => toggleMenu()}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="menu-links">
            <span className="text-xl font-medium tracking-tight items-center mx-2">
              <a href="#about" onClick={() => toggleMenu()}>Home</a>
            </span>
            <span className="text-xl font-medium tracking-tight items-center mx-2">
              <a href="#experience" onClick={() => toggleMenu()}>About</a>
            </span>
            <span className="text-xl font-medium tracking-tight items-center mx-2">
              <a href="#contact" onClick={() => toggleMenu()}>Contact</a>
            </span>
          </div>
        </div>

        <div className="flex">
          <FontAwesomeIcon
            icon={faUser}
            className="h-10 w-10 cursor-pointer filter brightness-0"
          />
        </div>
      </nav>
      <hr className="border-t border-gray-200" />
    </div>
  );
}

export default Navbar;
