const STORAGE_KEY = "concertReviews"; // { [concertId]: [{ rating, comment }] }

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getReviews(concertId) {
  return readAll()[concertId] || [];
}

// Prototype: one browser, one flat local blob — no accounts, so this browser only ever
// has one entry per concert, patched in place (a star click, a posted comment, both edit
// the same review rather than piling up duplicates). Kept as an array per concert, not a
// single {rating, comment}, on the bet a real backend swaps this file for API calls without
// touching the components that render it: they already expect a list, just one from many
// people instead of one from this browser.
export function upsertReview(concertId, patch) {
  const all = readAll();
  const existing = all[concertId] || [];
  const current = existing[existing.length - 1] || { rating: 0, comment: "" };
  const reviews = [...existing.slice(0, -1), { ...current, ...patch }];
  all[concertId] = reviews;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return reviews;
}
