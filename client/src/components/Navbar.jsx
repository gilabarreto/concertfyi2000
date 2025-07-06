import { Link } from "react-router-dom";
import { useState } from "react";
import SearchBar from "./SearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLocationDot } from "@fortawesome/free-solid-svg-icons";

function Navbar({
  city,
  value,
  setValue,
  setSetlist,
  setTicketmaster,
  setLat,
  setLong
}) {

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" }
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white shadow z-20">      <nav className="flex w-full justify-items-center justify-center items-center px-6 py-4 h-16 font-sans flex-wrap gap-4">
      <div>
        <Link
          to="/"
          className="text-3xl font-medium tracking-tight items-center"
          onClick={() => setValue("")}
          aria-label="Home"
        >
          <span className="hidden sm:inline">concert</span>
          <span className="text-3xl font-medium tracking-tight items-center">
            {"{"}
          </span>
          <span className="text-3xl tracking-tight font-semibold text-red-600">
            fyi
          </span>
          <span className="text-3xl font-medium tracking-tight items-center">
            {"}"}
          </span>
        </Link>
      </div>

      <div className="flex justify-center items-center">
        <FontAwesomeIcon
          className="text-2xl tracking-tight font-bold text-red-600 px-1"
          icon={faLocationDot}
          aria-hidden="true"
        />
        <span className="hidden sm:block cursor-pointer text-2xl font-medium tracking-tight hover:text-gray-500 hover:underline hover:underline-offset-8  hover:opacity-90 transition-all duration-300 ease-in-out">
          {city || "Locating..."}
        </span>
      </div>

      <div className="flex">
        <SearchBar
          setSetlist={setSetlist}
          setTicketmaster={setTicketmaster}
          setLat={setLat}
          setLong={setLong}
          value={value}
          setValue={setValue}
        />
      </div>

      <div className="hidden sm:flex justify-center items-center gap-2">
        <span className="text-2xl font-medium tracking-tight items-center">
          {"{"}
        </span>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="text-2xl tracking-tight font-medium text-red-600 hover:text-red-700 hover:underline hover:underline-offset-8  hover:opacity-90 transition-all duration-300 ease-in-out hidden sm:inline" // Melhoria 15: Efeito hover
            onClick={() => setValue("")}
          >
            {link.label}
          </Link>
        ))}
        <span className="text-2xl font-medium tracking-tight items-center">
          {"}"}
        </span>

      </div>

      <div className="sm:hidden flex items-center z-30">
        <button
          onClick={toggleMenu}
          className="text-red-600 text-3xl focus:outline-none"
          aria-expanded={isOpen} // Indica estado do menu
          aria-label="Menu"
        >
          <span className="flex items-center">
            <span className="text-black mr-2">{"{"}</span>
            <span className="inline-block w-6 text-center">
              {isOpen ? "×" : "☰"}
            </span>              <span className="text-black ml-2">{"}"}</span>
          </span>
        </button>
      </div>

      <button aria-label="User profile" className="flex">
        <FontAwesomeIcon
          icon={faUser}
          className="text-3xl cursor-pointer filter brightness-0"
        />
      </button>
    </nav>

      {isOpen && (
        <div className="sm:hidden bg-white shadow-md px-6 py-4 flex flex-col space-y-4 text-xl font-bold text-red-600 animate-fade-in-down " role="menu">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={closeMenu} // Melhoria 25: Fecha menu ao clicar
              role="menuitem" // Melhoria 26: Item de menu ARIA
              className="
          hover:text-red-700
          hover:underline hover:underline-offset-8
          hover:opacity-90
          transition-all duration-300 ease-in-out
        "
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <hr className="border-t border-gray-200" />
    </header>
  );
}

export default Navbar;
