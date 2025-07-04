import SpotifyPlayer from "react-spotify-player";

// Player component that takes in a ticketmaster object as props and displays a Spotify player
export default function Player(props) {
  // Get the Spotify URL from the ticketmaster object, or set it to null if not available
  const spotify = props.ticketmaster.attractions
    ? props.ticketmaster.attractions[0]?.externalLinks?.spotify?.[0]?.url ||
      null
    : null;

  // Set the size, view, and theme of the Spotify player
  const size = {
    width: "100%",
    height: "100%",
  };
  const view = "list"; // or 'coverart'
  const theme = "black"; // or 'white'

  if (!spotify) {
    return (
      <div className="text-white text-center">
        Spotify link not available for this artist.
      </div>
    );
  }

  // Render the SpotifyPlayer component with the Spotify URI and settings as props
  return (
    <div className="spotify-player-container">
      <SpotifyPlayer uri={spotify} size={size} view={view} theme={theme} />
    </div>
  );
}
