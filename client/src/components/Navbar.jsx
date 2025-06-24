import { Link } from "react-router-dom";
import { useState } from "react";
import SearchBar from "./SearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLocationDot } from "@fortawesome/free-solid-svg-icons";

function Navbar(props) {

  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="fixed w-full bg-white shadow z-20">
      <nav className="flex w-full justify-items-center justify-center items-center px-6 py-4 h-16 font-sans flex-wrap gap-4">
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

        <div className="flex justify-center items-center gap-2">
          <FontAwesomeIcon
            className="text-2xl tracking-tight font-bold text-red-600 px-1"
            icon={faLocationDot}
          />
          <span className="hidden sm:block text-2xl font-medium tracking-tight">
            {props.city || "Locating..."}
          </span>
        </div>

        <div className="flex">
          <SearchBar
            setSetlist={props.setSetlist}
            setTicketmaster={props.setTicketmaster}
            setLat={props.setLat}
            setLong={props.setLong}
            value={props.value}
            setValue={props.setValue}
          />
        </div>

        <div className="hidden sm:flex justify-center items-center gap-2">

          <span className="text-3xl font-medium tracking-tight items-center">
            {"{"}
          </span>
          <span className="text-2xl tracking-tight font-medium text-red-600 hidden sm:inline">
            Home
          </span>
          <span className="text-2xl tracking-tight font-medium text-red-600 hidden sm:inline">
            About
          </span>
          <span className="text-2xl tracking-tight font-medium text-red-600 hidden sm:inline">
            Contact
          </span>
          <span className="text-2xl tracking-tight font-bold text-red-600 inline sm:hidden">Menu</span>

          <span className="text-3xl font-medium tracking-tight items-center">
            {"}"}
          </span>

        </div>

        {/* Hamburger Button */}
        <div className="sm:hidden flex items-center z-30">
          <button
            onClick={toggleMenu}
            className="text-red-600 text-3xl focus:outline-none"
          >
            {isOpen ? (
              <span className="flex items-center">
                <span className="text-black mr-2">{"{"}</span>
                &times;
                <span className="text-black ml-2">{"}"}</span>
              </span>
            ) : (
              <span className="flex items-center">
                <span className="text-black mr-1">{"{"}</span>
                &#9776;
                <span className="text-black ml-1">{"}"}</span>
              </span>
            )}
          </button>
        </div>

        <div className="flex">
          <FontAwesomeIcon
            icon={faUser}
            className="text-3xl cursor-pointer filter brightness-0"
          />
        </div>
      </nav>
      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="sm:hidden bg-white shadow-md px-6 py-4 flex flex-col space-y-4 text-xl font-bold text-red-600 animate-fade-in-down">
          <Link to="/" onClick={toggleMenu}>Home</Link>
          <Link to="/about" onClick={toggleMenu}>About</Link>
          <Link to="/contact" onClick={toggleMenu}>Contact</Link>
        </div>
      )}

      <hr className="border-t border-gray-200" />
    </div>
  );
}

export default Navbar;
