// Spotify's own embed is an iframe; the wrapper packages that used to be here added a
// dependency for the same markup. The artist link only needs "/embed" spliced into it.
export default function Player({ ticketmaster }) {
  const spotify = ticketmaster.attractions?.[0]?.externalLinks?.spotify?.[0]?.url;

  if (!spotify) {
    return (
      <div className="text-white text-center">
        Spotify link not available for this artist.
      </div>
    );
  }

  return (
    <iframe
      className="w-full h-[500px] lg:h-full rounded-2xl"
      src={spotify.replace("open.spotify.com/", "open.spotify.com/embed/")}
      title="Artist on Spotify"
      allow="encrypted-media; clipboard-write"
    />
  );
}
