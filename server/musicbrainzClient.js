const { request } = require("./http");

// Shared by biography and poster lookups: MusicBrainz allows one request/second
// per IP, so adding a second route must not create a second independent budget.
const cache = new Map();
const pending = new Map();
let queue = Promise.resolve();
let nextStart = 0;
const TTL = 6 * 60 * 60 * 1000;

async function musicbrainzRequest(path, params = {}) {
  const key = JSON.stringify([path, params]);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;
  if (pending.has(key)) return pending.get(key);
  // Bound the queue rather than keeping visitors waiting behind unlimited work.
  if (pending.size >= 4) throw Object.assign(new Error("MusicBrainz busy"), { status: 503 });

  const task = queue.then(async () => {
    const delay = nextStart - Date.now();
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    nextStart = Date.now() + 1100;
    const data = await request(`https://musicbrainz.org/ws/2/${path}`, {
      params: { fmt: "json", ...params },
      headers: { "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!data || typeof data !== "object") throw new Error("Invalid MusicBrainz response");
    if (cache.size >= 200) cache.delete(cache.keys().next().value);
    cache.set(key, { data, expires: Date.now() + TTL });
    return data;
  });
  queue = task.catch(() => {});
  pending.set(key, task);
  try {
    return await task;
  } finally {
    pending.delete(key);
  }
}

module.exports = { musicbrainzRequest };
