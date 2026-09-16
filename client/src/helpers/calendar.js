// Three ways into a calendar, none of which stores anything here or needs OAuth:
// Google and Outlook take a template URL, Apple only accepts a file, so it gets the
// .ics. The trade on the web links is the reminder: they apply the account default,
// while the .ics carries our own two alarms.

const utcStamp = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");
const dayStamp = (localDate) => localDate.replace(/-/g, "");

const addDays = (localDate, days) => {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// The pieces all three targets need, or null when the date is missing and the entry
// would land on the wrong day. Every entry is all day: the doors time is a promise the
// event rarely keeps, and a whole-day block is what the day actually costs.
function details(event, artistName) {
  const localDate = event?.dates?.start?.localDate;
  if (!localDate) return null;

  const venue = event._embedded?.venues?.[0];

  return {
    localDate,
    endDate: addDays(localDate, 1),
    title: venue?.name ? `${artistName} at ${venue.name}` : artistName,
    place: [venue?.name, venue?.city?.name, venue?.state?.stateCode || venue?.country?.countryCode]
      .filter(Boolean)
      .join(", "),
    url: event.url,
    id: event.id,
  };
}

export function googleCalendarUrl(event, artistName) {
  const show = details(event, artistName);
  if (!show) return null;

  // Google reads the end of an all-day range as exclusive
  const dates = `${dayStamp(show.localDate)}/${dayStamp(show.endDate)}`;

  const params = new URLSearchParams({ action: "TEMPLATE", text: show.title, dates });
  if (show.place) params.set("location", show.place);
  if (show.url) params.set("details", show.url);

  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookCalendarUrl(event, artistName) {
  const show = details(event, artistName);
  if (!show) return null;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: show.title,
    startdt: show.localDate,
    enddt: show.endDate,
    allday: "true",
  });

  if (show.place) params.set("location", show.place);
  if (show.url) params.set("body", show.url);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

// RFC 5545 gives backslash, semicolon and comma special meaning inside a value
const escape = (text) =>
  String(text)
    .replace(/[\\;,]/g, (char) => `\\${char}`)
    .replace(/\r?\n/g, "\\n");

const alarm = (trigger, description) => [
  "BEGIN:VALARM",
  `TRIGGER:${trigger}`,
  "ACTION:DISPLAY",
  `DESCRIPTION:${escape(description)}`,
  "END:VALARM",
];

export function concertIcs(event, artistName, { now = new Date() } = {}) {
  const show = details(event, artistName);
  if (!show) return null;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ConcertFYI//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${show.id}@concertfyi.com`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;VALUE=DATE:${dayStamp(show.localDate)}`,
    `DTEND;VALUE=DATE:${dayStamp(show.endDate)}`,
    `SUMMARY:${escape(show.title)}`,
    show.place && `LOCATION:${escape(show.place)}`,
    show.url && `URL:${escape(show.url)}`,
    ...alarm("-P1D", `${artistName} plays tomorrow`),
    // an all-day entry starts at midnight, so the day-of alarm runs forward to 9am
    ...alarm("PT9H", `${artistName} plays tonight`),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

// ponytail: a data: URI keeps the download stateless, no blob to create and revoke.
// Swap to a blob URL if iOS Safari ever refuses to save it.
export function concertIcsUrl(event, artistName) {
  const ics = concertIcs(event, artistName);
  return ics && `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
