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

const SHOW_HOURS = 3;

// The pieces all three targets need, or null when the date is missing and the entry
// would land on the wrong day. dateTime carries the exact UTC start; without it the
// show can only be an all-day entry.
function details(event, artistName) {
  const start = event?.dates?.start;
  const localDate = start?.localDate;
  if (!localDate) return null;

  const venue = event._embedded?.venues?.[0];

  return {
    localDate,
    startsAt: start.dateTime ? new Date(start.dateTime) : null,
    endsAt: start.dateTime
      ? new Date(Date.parse(start.dateTime) + SHOW_HOURS * 3600000)
      : null,
    endDate: addDays(localDate, 1),
    title: venue?.name ? `${artistName} at ${venue.name}` : artistName,
    place: [
      venue?.name,
      venue?.city?.name,
      venue?.state?.stateCode || venue?.country?.countryCode,
    ]
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
  const dates = show.startsAt
    ? `${utcStamp(show.startsAt)}/${utcStamp(show.endsAt)}`
    : `${dayStamp(show.localDate)}/${dayStamp(show.endDate)}`;

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
    startdt: show.startsAt ? show.startsAt.toISOString() : show.localDate,
    enddt: show.endsAt ? show.endsAt.toISOString() : show.endDate,
  });

  if (!show.startsAt) params.set("allday", "true");
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

  const [dtstart, dtend] = show.startsAt
    ? [`DTSTART:${utcStamp(show.startsAt)}`, `DTEND:${utcStamp(show.endsAt)}`]
    : [
        `DTSTART;VALUE=DATE:${dayStamp(show.localDate)}`,
        `DTEND;VALUE=DATE:${dayStamp(show.endDate)}`,
      ];

  // The second alarm has to land on the show day itself. A timed show starts in the
  // evening, so twelve hours earlier is that morning; an all-day entry starts at
  // midnight, so the trigger runs forward to 9am instead.
  const sameDay = show.startsAt ? "-PT12H" : "PT9H";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ConcertFYI//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${show.id}@concertfyi.com`,
    `DTSTAMP:${utcStamp(now)}`,
    dtstart,
    dtend,
    `SUMMARY:${escape(show.title)}`,
    show.place && `LOCATION:${escape(show.place)}`,
    show.url && `URL:${escape(show.url)}`,
    ...alarm("-P1D", `${artistName} plays tomorrow`),
    ...alarm(sameDay, `${artistName} plays tonight`),
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
