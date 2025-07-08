import SpotifyPlayer from "react-spotify-player";

export default function Player(props) {
  const spotify = props.ticketmaster.attractions
    ? props.ticketmaster.attractions[0]?.externalLinks?.spotify?.[0]?.url ||
      null
    : null;

  const size = {
    width: "100%",
    height: "100%",
  };
  const view = "list";
  const theme = "black";

  if (!spotify) {
    return (
      <div className="text-white text-center">
        Spotify link not available for this artist.
      </div>
    );
  }

  return (
    <div className="spotify-player-container">
      <SpotifyPlayer uri={spotify} size={size} view={view} theme={theme} />
    </div>
  );
}
