import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConcertInfo from "./ArtistPage/ConcertInfo";
import Map from "./ArtistPage/Map";
import Setlist from "./ArtistPage/Setlist";
import Player from "./ArtistPage/Player";
import UpcomingConcertList from "./ArtistPage/UpcomingConcerts";
import PreviousConcerts from "./ArtistPage/PreviousConcerts";

export default function ArtistPage(props) {
    const navigate = useNavigate();
  
  // State for Spotify artist or track
  const [spotifyArtist, setSpotifyArtist] = useState([]);

  // Get artistId and concertId from URL params
  let { concertId, artistId } = useParams();

  // If setlist is empty or ticketmaster is undefined, render nothing
  if (props.setlist.length === 0 || props.ticketmaster === undefined) {
    return null;
  }

  // Get the concert data that matches the concertId
  const concert = props.setlist.find((result) => result.id === concertId);

  useEffect(() => {
    if (!concert) {
      navigate("/");
    }
  }, [concert, navigate]);

  if (!concert) return null;

  const attraction = props.ticketmaster.attractions?.find(
    (a) => a.name === concert.artist.name
  );
  const artistImage = attraction?.images?.[0]?.url || "";

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Concert info section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="bg-white rounded-xl p-6 shadow flex-1 space-y-2">
          <ConcertInfo
            concert={concert}
            setlist={props.setlist}
            ticketmaster={props.ticketmaster}
            artistImage={artistImage}
          />
        </div>

        {/* Map section */}
        <div className="bg-gray-100 rounded-xl shadow flex-1 h-64 lg:h-auto">
          {props.ticketmaster ? <Map concert={concert} /> : null}
        </div>
      </div>

      {/* Bottom section of the artist page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow space-y-2">
          <Setlist concert={concert} />
        </div>

        {/* Spotify section */}
        <div className="bg-black text-white rounded-xl p-6 shadow flex items-center justify-center">
          <Player
            concert={concert}
            ticketmaster={props.ticketmaster}
            spotifyArtist={spotifyArtist}
            setSpotifyArtist={setSpotifyArtist}
          />
        </div>

        {/* Bottom right section */}
        <div>
          <div className="bg-white rounded-xl p-6 shadow">
            <UpcomingConcertList
              ticketmaster={props.ticketmaster}
              setlist={props.setlist}
              concert={concert}
            />
          </div>

          {/* Previous concerts section */}
          <div className="bg-white rounded-xl p-6 shadow mt-6">
            <PreviousConcerts
              concert={concert}
              setlist={props.setlist}
              artistId={artistId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
