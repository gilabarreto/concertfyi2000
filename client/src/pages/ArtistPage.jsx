import { useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { useSetlistById, useArtistData } from "../api/queries";
import ArtistInfo from "../components/ArtistPage/ArtistInfo";
import ConcertInfo from "../components/ArtistPage/ConcertInfo";
import Setlist from "../components/ArtistPage/Setlist";
import Player from "../components/ArtistPage/Player";
import UpcomingConcerts from "../components/ArtistPage/UpcomingConcerts";
import PastConcerts from "../components/ArtistPage/PastConcerts";
import { AppContext } from "../context/AppContext";
import { SEOHead } from "../components/SEOHead";

export default function ArtistPage() {
  const { setlist = [], ticketmaster = {}, setSetlist, setTicketmaster } = useContext(AppContext);
  const { concertId, artistId } = useParams();

  const concert = setlist.find((result) => result.id === concertId);

  // Opened directly (new tab, refresh, shared link): context is empty, so load by URL
  const { data: urlConcert, isError } = useSetlistById(concert ? null : concertId);
  const { data: artistData } = useArtistData(urlConcert?.artist?.name);

  useEffect(() => {
    if (!urlConcert || !artistData) return;
    const list = artistData.setlist;
    setSetlist(list.some((s) => s.id === urlConcert.id) ? list : [urlConcert, ...list]);
    setTicketmaster(artistData.ticketmaster);
  }, [urlConcert, artistData, setSetlist, setTicketmaster]);

  if (isError) {
    return (
      <div className="p-8 w-full text-center text-gray-500">
        Concert not found.{" "}
        <Link to="/" className="text-red-600 underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (!concert) {
    return <div className="p-8 w-full text-center text-gray-400">Loading concert info…</div>;
  }

  const attraction = ticketmaster.attractions?.find((a) => a.name === concert.artist.name);
  const artistImage = attraction?.images?.[0]?.url || "";
  const artistName = concert.artist.name;
  const concertDate = concert.eventDate;
  const concertVenue = concert.venue?.name || "Concert";

  return (
    <>
      <SEOHead
        title={`${artistName} - ${concertVenue} - ${concertDate}`}
        description={`Setlist and details for ${artistName} at ${concertVenue} on ${concertDate}. Explore songs performed and concert information.`}
        image={artistImage}
        url={`/artists/${artistId}/concerts/${concertId}`}
      />
      <div className="w-full mx-auto p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="bg-white rounded-xl p-6 shadow flex-1 space-y-2">
            <ArtistInfo concert={concert} setlist={setlist} ticketmaster={ticketmaster} />
          </div>

          <div className="bg-white rounded-xl p-6 shadow flex-1 space-y-2">
            <ConcertInfo concert={concert} setlist={setlist} ticketmaster={ticketmaster} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow space-y-2">
            <Setlist concert={concert} />
          </div>

          <div className="bg-black text-white rounded-3xl p-2 shadow flex items-center justify-center">
            <Player ticketmaster={ticketmaster} />
          </div>

          <div>
            <div className="bg-white rounded-xl p-6 shadow space-y-2">
              <PastConcerts concert={concert} setlist={setlist} artistId={artistId} />
            </div>

            <div className="bg-white rounded-xl p-6 shadow mt-6 space-y-2">
              <UpcomingConcerts ticketmaster={ticketmaster} setlist={setlist} concert={concert} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
