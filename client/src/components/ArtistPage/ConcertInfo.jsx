import { FaYoutube, FaInstagram, FaTwitter } from "react-icons/fa"; // Importing icons from react-icons library

import ConcertDate from "./ConcertDate"; // Importing ConcertDate component

export default function ConcertInfo(props) {
  // Extracting required data from props
  const artistInfo = props.setlist;
  const concert = props.concert;

  // Extracting required data from concert object
  const artist = concert.artist.name;
  const tour = concert.tour?.name || "No tour name"; // If tour name is not present, "No tour name" will be used instead
  const venue = concert.venue?.name;
  const city = concert.venue.city?.name;
  const state = concert.venue.city?.state;
  const country = concert.venue.city?.country.code;

  return (
    <>
      <h2 class="text-4xl font-bold">{artist}</h2>
      <div className="socials-icons">
        {/* Checking if ticketmaster.attractions object exists before accessing youtube, instagram, and twitter links */}
        {props.ticketmaster.attractions ? (
          <a
            href={
              props.ticketmaster.attractions[0].externalLinks.youtube[0].url
            }
            target="_blank"
            rel="noreferrer"
          >
            Youtube&ensp;
          </a>
        ) : null}
        {props.ticketmaster.attractions ? (
          <a
            href={
              props.ticketmaster.attractions[0].externalLinks.instagram[0].url
            }
            target="_blank"
            rel="noreferrer"
          >
            Instagram&ensp;
          </a>
        ) : null}
        {props.ticketmaster.attractions ? (
          <a
            href={
              props.ticketmaster.attractions[0].externalLinks.twitter[0].url
            }
            target="_blank"
            rel="noreferrer"
          >
            Twitter&ensp;
          </a>
        ) : null}
      </div>
      <ol>
        <ConcertDate
          concert={concert}
          setlist={props.setlist}
          artistInfo={artistInfo}
        />
        <hr class="border-t border-gray-300 opacity-50"></hr>
        <h2 className="tour">Tour:&ensp;{tour}</h2>
        <hr class="border-t border-gray-300 opacity-50"></hr>
        <h2>Venue:&ensp;{venue}</h2>
        <hr class="border-t border-gray-300 opacity-50"></hr>
        <h2>
          Location:&ensp;{city}, {state}, {country}
        </h2>
      </ol>
    </>
  );
}
