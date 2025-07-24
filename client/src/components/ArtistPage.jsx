import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConcertInfo from "./ArtistPage/ConcertInfo";
import Map from "./ArtistPage/Map";
import Setlist from "./ArtistPage/Setlist";
import Player from "./ArtistPage/Player";
import NextConcertList from "./ArtistPage/NextConcerts";
import LastConcerts from "./ArtistPage/LastConcerts";

export default function ArtistPage(props) {
  const navigate = useNavigate();
  const [spotifyArtist, setSpotifyArtist] = useState([]);
  const { concertId, artistId } = useParams();

  if (!props.setlist.length || !props.ticketmaster) return null;

  const concert = props.setlist.find((result) => result.id === concertId);

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

  const attraction = props.ticketmaster.attractions?.find(
    (a) => a.name === concert.artist.name
  );
  const artistImage = attraction?.images?.[0]?.url || "";

  return (
    <div className="w-full mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="bg-white rounded-xl p-6 shadow flex-1 space-y-2">
          <ConcertInfo
            concert={concert}
            setlist={props.setlist}
            ticketmaster={props.ticketmaster}
            artistImage={artistImage}
          />
        </div>

        <div className="bg-gray-100 rounded-xl shadow flex-1 h-64 lg:h-auto">
          {props.ticketmaster && <Map concert={concert} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow space-y-2">
          <Setlist concert={concert} />
        </div>

        <div className="bg-black text-white rounded-3xl p-2 shadow flex items-center justify-center">
          <Player
            concert={concert}
            ticketmaster={props.ticketmaster}
            spotifyArtist={spotifyArtist}
            setSpotifyArtist={setSpotifyArtist}
          />
        </div>

        <div>
          <div className="bg-white rounded-xl p-6 shadow">
            <LastConcerts
              concert={concert}
              setlist={props.setlist}
              artistId={artistId}
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow mt-6">
            <NextConcertList
              ticketmaster={props.ticketmaster}
              setlist={props.setlist}
              concert={concert}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
