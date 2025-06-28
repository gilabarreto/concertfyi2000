import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faCirclePlay } from "@fortawesome/free-solid-svg-icons";
import { faFileLines } from "@fortawesome/free-regular-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";


export default function Setlist(props) {
  const songs = props.concert.sets.set[0]?.song || [];
  const artistName = props.concert.artist.name;

  return (
    <>
      <div className="flex flex-1 justify-around mb-2">
        <h2 className="flex-1 text-4xl font-bold mb-2">Setlist</h2>
        <span className="flex">
          <FontAwesomeIcon
            icon={faCircleInfo}
            className="cursor-pointer text-gray-500"
            size="lg"
          />
        </span>
      </div>
      <hr className="border-t border-gray-300 opacity-50 ml-6"></hr>
      <ol className="list-decimal list-inside pl-6">
        {songs.length === 0 ? (
          <span className="py-2">
            There are no songs in this setlist. Please come back later.
          </span>
        ) : (
          songs.map((song, songIndex) => {
            const songName = song.name;
            const query = encodeURIComponent(`${artistName} ${songName}`);

            const spotifyUrl = `https://open.spotify.com/search/${query}`;
            const youtubeUrl = `https://www.youtube.com/results?search_query=${query}`;
            const lyricsUrl = `https://genius.com/search?q=${query}`;

            return (
              <li
                key={songIndex}
                className="flex items-center justify-between border-b border-gray-300/50 py-1"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-gray-500 font-semibold">
                    {songIndex + 1}.
                  </span>
                  <span>{songName}</span>
                </span>
                <span className="flex items-center space-x-3">
                  <a href={spotifyUrl} target="_blank" rel="noreferrer">
                    <FontAwesomeIcon
                      icon={faMusic}
                      className="text-red-600 hover:text-red-800"
                    />
                  </a>
                  <a href={youtubeUrl} target="_blank" rel="noreferrer">
                    <FontAwesomeIcon
                      icon={faCirclePlay}
                      className="text-red-600 hover:text-red-800"
                    />
                  </a>
                  <a href={lyricsUrl} target="_blank" rel="noreferrer">
                    <FontAwesomeIcon
                      icon={faFileLines}
                      className="text-red-600 hover:text-red-800"
                    />
                  </a>
                </span>
              </li>
            );
          })
        )}
      </ol>
    </>
  );
}
