import jwtdecode from "jwt-decode";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/api";
import SearchBar from "./SearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

function Navbar(props) {
  const [dropdownLogin, setDropdownLogin] = useState(false);
  const toggleLogin = useCallback(() => {
    setDropdownLogin((opened) => !opened);
  }, []);

  const [isUserLogged, setIsUserLogged] = useState(
    JSON.parse(localStorage.getItem("user")) || false
  );
  const [isRegistered, setIsRegistered] = useState(
    JSON.parse(localStorage.getItem("user")) || false
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const clear = () => {
    setName("");
    setPassword("");
    setEmail("");
    setErrorMsg("");
  };

  const handleClick = () => {
    props.setValue("");
  };

  const register = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(name, email, password);
      setIsUserLogged(true);
      const { token } = res.data;
      const decode = jwtdecode(token);
      localStorage.setItem("user", JSON.stringify(decode));
      clear();
      setDropdownLogin(false);
    } catch (err) {
      console.log(err);
      const error = err.response?.data?.error;
      if (error) setErrorMsg(error);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(email, password);
      setIsUserLogged(true);
      const { token } = res.data;
      const decode = jwtdecode(token);
      localStorage.setItem("user", JSON.stringify(decode));
      localStorage.setItem("token", token);
      clear();
      setDropdownLogin(false);
    } catch (err) {
      console.log(err);
      const error = err.response?.data?.error;
      if (error) setErrorMsg(error);
    }
  };

  const logout = useCallback(() => {
    setIsUserLogged(false);
    setDropdownLogin(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  }, [navigate]);

  return (
    <div className="fixed top-0 left-0 w-full bg-white shadow z-20">
      <nav className="container mx-auto px-16 flex items-center justify-between h-16 font-sans">
        <div>
          <Link
            to="/search"
            className="flex text-2xl items-center"
            onClick={() => props.setValue("")}
          >
            © concertfyi
          </Link>
        </div>
        <div className="flex-1 mx-8">
          <SearchBar
            setSetlist={props.setSetlist}
            setTicketmaster={props.setTicketmaster}
            setLat={props.setLat}
            setLong={props.setLong}
            value={props.value}
            setValue={props.setValue}
          />
        </div>
        <div className="flex">
          <FontAwesomeIcon
            icon={faUser}
            onClick={toggleLogin}
            className="h-10 w-10 cursor-pointer filter brightness-0"
          ></FontAwesomeIcon>
          {dropdownLogin && (
            <div className="absolute right-16 top-16 z-20 w-64 bg-white rounded-lg shadow-lg p-5">
              {" "}
              {isUserLogged ? (
                <>
                  <button
                    className="submit-button"
                    onClick={() => {
                      navigate("/favourite");
                      toggleLogin();
                    }}
                  >
                    Favourites
                  </button>
                  <button className="submit-button" onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {isRegistered === false && (
                    <span id="login-form">
                      <form onSubmit={login}>
                        {errorMsg && (
                          <span style={{ fontWeight: "bold", color: "red" }}>
                            {errorMsg}
                          </span>
                        )}
                        <div className="input-container-login">
                          <input
                            className="input-text-login"
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </div>
                        <div className="input-container-login">
                          <input
                            className="input-text-login"
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <button className="submit-button" type="submit">
                            Login
                          </button>
                        </div>
                      </form>
                    </span>
                  )}
                  {isRegistered === true && (
                    <span id="register-form">
                      <form onSubmit={register}>
                        {errorMsg && (
                          <span style={{ fontWeight: "bold", color: "red" }}>
                            {errorMsg}
                          </span>
                        )}
                        <div className="input-container-login">
                          <input
                            className="input-text-login"
                            name="name"
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                          />
                        </div>
                        <div className="input-container-login">
                          <input
                            className="input-text-login"
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </div>
                        <div className="input-container-login">
                          <input
                            className="input-text-login"
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <button className="submit-button" type="submit">
                            Register
                          </button>
                        </div>
                      </form>
                    </span>
                  )}
                  {isRegistered === false && (
                    <>
                      <span className="register-login-text">
                        Not a member?{" "}
                      </span>
                      <span
                        className="toggle-register-login"
                        onClick={() => {
                          setIsRegistered((prev) => !prev);
                          clear();
                        }}
                      >
                        Register
                      </span>
                    </>
                  )}
                  {isRegistered === true && (
                    <>
                      <span className="register-login-text">
                        Have an account?{" "}
                      </span>
                      <span
                        className="toggle-register-login"
                        onClick={() => {
                          setIsRegistered((prev) => !prev);
                          clear();
                        }}
                      >
                        Login
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </nav>
      <hr className="border-t border-gray-200" />
    </div>
  );
}

export default Navbar;
