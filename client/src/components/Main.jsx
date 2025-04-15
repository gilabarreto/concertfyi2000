import "./Main.css";
import SearchBar from "./SearchBar";

export default function Main(props) {
  return (
    <>
      <div>
        <SearchBar
          setSetlist={props.setSetlist}
          setTicketmaster={props.setTicketmaster}
          setLat={props.setLat}
          setLong={props.setLong}
          value={props.value}
          setValue={props.setValue}
        />
      </div>
    </>
  );
}
