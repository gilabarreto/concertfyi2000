import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-solid-svg-icons";
import { googleCalendarUrl } from "../../helpers/calendar";

export default function ConcertReminder({ event, artistName }) {
  const href = googleCalendarUrl(event, artistName);
  if (!href) return null;

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 sm:p-4 flex justify-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded flex items-center gap-2 transition-colors"
      >
        <FontAwesomeIcon icon={faCalendarPlus} aria-hidden="true" />
        Add to Google Calendar
      </a>
    </div>
  );
}
