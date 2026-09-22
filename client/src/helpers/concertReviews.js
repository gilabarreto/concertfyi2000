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

// Prototype: one browser, one flat local blob — no accounts, so "reviews" here only ever
// grows from this one visitor. Kept as an array per concert (not a single {rating, comment})
// on the bet that a real backend swaps this file for API calls without touching the
// components that render it: they already expect a list, just one from many people instead.
export function addReview(concertId, review) {
  const all = readAll();
  const reviews = [...(all[concertId] || []), review];
  all[concertId] = reviews;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return reviews;
}
