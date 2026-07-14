import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConcertInfo from "../components/ArtistPage/ConcertInfo";
import Map from "../components/ArtistPage/Map";
import Setlist from "../components/ArtistPage/Setlist";
import Player from "../components/ArtistPage/Player";
import NextConcertList from "../components/ArtistPage/NextConcerts";
import LastConcerts from "../components/ArtistPage/LastConcerts";
import { AppContext } from "../context/AppContext";
import { SEOHead } from "../components/SEOHead";

export default function ArtistPage() {
  const { setlist = [], ticketmaster = {} } = useContext(AppContext);
  const navigate = useNavigate();
  const [spotifyArtist, setSpotifyArtist] = useState([]);
  const { concertId, artistId } = useParams();

  if (!setlist.length || !ticketmaster) return null;

  const concert = setlist.find((result) => result.id === concertId);

  useEffect(() => {
    if (!concert) navigate("/");
  }, [concert, navigate]);

  if (!concert) {
    return (
      <div className="p-8 text-center text-gray-400">
        Loading concert info…
      </div>
    );
  }

  const attraction = ticketmaster.attractions?.find(
    (a) => a.name === concert.artist.name
  );
  const artistImage = attraction?.images?.[0]?.url || "";
  const artistName = concert.artist.name;
  const concertDate = concert.eventDate;
  const concertVenue = concert.venue?.name || 'Concert';

  return (
    <>
      <SEOHead
        title={`${artistName} - ${concertVenue} - ${concertDate}`}
        description={`Setlist and details for ${artistName} at ${concertVenue} on ${concertDate}. Explore songs performed and concert information.`}
        image={artistImage}
        url={`/artists/${artistId}/concerts/${concertId}`}
      />
      <div className="w-full mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="bg-white rounded-xl p-6 shadow flex-1 space-y-2">
          <ConcertInfo
            concert={concert}
            setlist={setlist}
            ticketmaster={ticketmaster}
            artistImage={artistImage}
          />
        </div>

        <div className="bg-gray-100 rounded-xl shadow flex-1 h-64 lg:h-auto">
          {ticketmaster && <Map concert={concert} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow space-y-2">
          <Setlist concert={concert} />
        </div>

        <div className="bg-black text-white rounded-3xl p-2 shadow flex items-center justify-center">
          <Player
            concert={concert}
            ticketmaster={ticketmaster}
            spotifyArtist={spotifyArtist}
            setSpotifyArtist={setSpotifyArtist}
          />
        </div>

        <div>
          <div className="bg-white rounded-xl p-6 shadow">
            <LastConcerts
              concert={concert}
              setlist={setlist}
              artistId={artistId}
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow mt-6">
            <NextConcertList
              ticketmaster={ticketmaster}
              setlist={setlist}
              concert={concert}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
