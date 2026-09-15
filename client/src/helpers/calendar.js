// Built in the browser so no email or phone number is ever stored: the reminder
// comes from the visitor's own calendar app via the alarm on the entry.

// RFC 5545 gives backslash, semicolon and comma special meaning inside a value
const escape = (text) =>
  String(text)
    .replace(/[\\;,]/g, (char) => `\\${char}`)
    .replace(/\r?\n/g, "\\n");

const utcStamp = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");
const dayStamp = (localDate) => localDate.replace(/-/g, "");

const addDays = (localDate, days) => {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const SHOW_HOURS = 3;

const alarm = (trigger, description) => [
  "BEGIN:VALARM",
  `TRIGGER:${trigger}`,
  "ACTION:DISPLAY",
  `DESCRIPTION:${escape(description)}`,
  "END:VALARM",
];

// event is a Ticketmaster event; returns an .ics string, or null when the date is
// missing and a calendar entry would land on the wrong day.
export function concertIcs(event, artistName, { now = new Date() } = {}) {
  const start = event?.dates?.start;
  const localDate = start?.localDate;
  if (!localDate) return null;

  const venue = event._embedded?.venues?.[0];
  const place = [
    venue?.name,
    venue?.city?.name,
    venue?.state?.stateCode || venue?.country?.countryCode,
  ]
    .filter(Boolean)
    .join(", ");

  // dateTime carries the exact UTC start; without it the show is an all-day entry
  const [dtstart, dtend] = start.dateTime
    ? [
        `DTSTART:${utcStamp(new Date(start.dateTime))}`,
        `DTEND:${utcStamp(new Date(Date.parse(start.dateTime) + SHOW_HOURS * 3600000))}`,
      ]
    : [
        `DTSTART;VALUE=DATE:${dayStamp(localDate)}`,
        `DTEND;VALUE=DATE:${dayStamp(addDays(localDate, 1))}`,
      ];

  const summary = place ? `${artistName} at ${venue.name}` : artistName;

  // The second alarm has to land on the show day itself. A timed show starts in the
  // evening, so twelve hours earlier is that morning; an all-day entry starts at
  // midnight, so the trigger runs forward to 9am instead.
  const sameDay = start.dateTime ? "-PT12H" : "PT9H";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ConcertFYI//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@concertfyi.com`,
    `DTSTAMP:${utcStamp(now)}`,
    dtstart,
    dtend,
    `SUMMARY:${escape(summary)}`,
    place && `LOCATION:${escape(place)}`,
    event.url && `URL:${escape(event.url)}`,
    ...alarm("-P1D", `${artistName} plays tomorrow`),
    ...alarm(sameDay, `${artistName} plays tonight`),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
