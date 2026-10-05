import { useContext } from "react";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons/faTrashCan";
import { AppContext } from "../context/AppContext";
import Icon from "./Icon";

import { useT } from "../i18n";
export default function ReminderDelete() {
  const t = useT();
  const { setConcertReminder, setReminderOpen, setReminderInteracted, setReminderSeen } =
    useContext(AppContext);
  return (
    <button
      type="button"
      aria-label={t("Delete reminder")}
      title={t("Delete reminder")}
      onClick={() => {
        document.querySelector("button[aria-controls][aria-label^='Concert reminders']")?.focus();
        setReminderInteracted(true);
        setReminderOpen(false);
        setReminderSeen(false);
        setConcertReminder(null);
      }}
      className="absolute right-11 top-1/2 flex h-11 w-6 -translate-y-1/2 items-center justify-center text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
    >
      <Icon icon={faTrashCan} className="text-sm" />
    </button>
  );
}
