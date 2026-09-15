import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-solid-svg-icons";
import { concertIcs } from "../../helpers/calendar";

export default function ConcertReminder({ event, artistName }) {
  const ics = concertIcs(event, artistName);
  if (!ics) return null;

  const save = () => {
    const file = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${artistName}-${event.dates.start.localDate}.ics`.replace(/[^\w.-]+/g, "-");
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-50 border-b border-gray-300/50 p-2 sm:p-4 flex justify-center">
      <button
        onClick={save}
        className="px-4 py-2 text-md font-semibold text-white bg-red-600 hover:bg-red-800 rounded flex items-center gap-2 transition-colors"
      >
        <FontAwesomeIcon icon={faCalendarPlus} aria-hidden="true" />
        Add to calendar
      </button>
    </div>
  );
}
