// Google's template URL opens the event pre-filled in the visitor's own calendar,
// so nothing is stored here and no OAuth is needed. The trade against a .ics file is
// the reminder: Google applies the account default instead of an alarm we set.

const utcStamp = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");
const dayStamp = (localDate) => localDate.replace(/-/g, "");

const addDays = (localDate, days) => {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const SHOW_HOURS = 3;

// event is a Ticketmaster event; returns a URL, or null when the date is missing and
// the entry would land on the wrong day.
export function googleCalendarUrl(event, artistName) {
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

  // dateTime carries the exact UTC start; without it the show is an all-day entry,
  // and Google reads the end of an all-day range as exclusive
  const dates = start.dateTime
    ? `${utcStamp(new Date(start.dateTime))}/${utcStamp(
        new Date(Date.parse(start.dateTime) + SHOW_HOURS * 3600000)
      )}`
    : `${dayStamp(localDate)}/${dayStamp(addDays(localDate, 1))}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: venue?.name ? `${artistName} at ${venue.name}` : artistName,
    dates,
  });

  if (place) params.set("location", place);
  if (event.url) params.set("details", event.url);

  return `https://calendar.google.com/calendar/render?${params}`;
}
