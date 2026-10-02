import { useContext } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../context/AppContext";
import Icon from "./Icon";

export default function ReminderClose() {
  const { setReminderOpen, setReminderInteracted } = useContext(AppContext);
  return (
    <button
      type="button"
      aria-label="Close reminder"
      title="Close reminder"
      onClick={() => {
        setReminderInteracted(true);
        setReminderOpen(false);
        document.querySelector("button[aria-controls][aria-label^='Concert reminders']")?.focus();
      }}
      className="absolute right-3 top-1/2 flex h-11 w-6 -translate-y-1/2 items-center justify-center text-white before:absolute before:-left-1 before:h-4 before:border-l before:border-white/50 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
    >
      <Icon icon={faXmark} />
    </button>
  );
}
