# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Two independent npm projects, no workspace root. Always `cd client` or `cd server` first.

```bash
# client (Vite dev server on :3000, proxies /api to localhost:4000 — run the server too)
cd client && npm run dev
cd client && npm run build       # vite build + copies dist/index.html to 404.html for GH Pages SPA routing

# server (Express on :4000)
cd server && npm run dev         # nodemon
cd server && npm start

# tests — node:test, no framework, no runner config, run from the repo root
node --test                      # both test files, ~0.1s
node --test server/http.test.js  # a single file

# the quality gate — root package.json is scripts only, NOT a workspace
npm run check                    # gitleaks (staged) + client lint + tests, ~2.5s
npm run check:full               # check + client build, ~5s
```

Read `CONSTRAINTS.md` before changing code, and make your change pass it. Never weaken a limit,
delete a test, or add a suppression to get a change through — if a limit is wrong, change it in its
own commit with the reason.

Deploy is automatic: push to `main` builds the client and publishes `client/dist` to the `gh-pages`
branch (`concertfyi.com`). The server is hosted separately on Render; nothing in this repo deploys it.

`.history/` is a VS Code local-history dump (gitignored, thousands of timestamped `.jsx` copies).
Exclude it from every search — grep/find hits there are stale duplicates, never the live file.

## Architecture

**Client (GitHub Pages) → Express proxy (Render) → third-party APIs.** The server exists only to
keep API keys off the browser; it has no database and no state. Every route is a thin pass-through.

### The two data sources and how they join

The whole app is a join between two APIs that share no ids:

- **Setlist.fm** — past concerts and their songs. Concerts keyed by `concert.id`, artist by
  `artist.mbid` (MusicBrainz id, which is the `:artistId` in URLs). Dates are `DD-MM-YYYY`.
- **Ticketmaster** — upcoming events and artist images. Events keyed by their own id, dates are
  `dates.start.localDate` (`YYYY-MM-DD`).

They are matched **by artist name string** (`attractions.find(a => a.name === concert.artist.name)`
in `ArtistPage.jsx`, the same filter in `NextConcerts.jsx`). There is no id mapping between them —
this is the fragile seam of the app, and it is why `useArtistData` fetches both in parallel and
swallows either one's failure rather than failing the page.

Because the two date formats differ, both list builders parse to a `dateObj` before sorting
(`selectors.js:getLastConcertsByArtist` for past, `NextConcerts.jsx` for upcoming).

### State: context for the session, React Query for fetching

`AppContext` (fed by `useAppState`) holds the current `setlist` + `ticketmaster` payloads so
navigating between concerts doesn't refetch, plus `selectedLocation` persisted to localStorage.
React Query owns everything network-shaped; all hooks live in `client/src/api/queries.js` and all
axios calls in `api.js`. Nothing else in the app should call the network directly.

Global defaults in `queryClient.js` are deliberately aggressive (`staleTime: 0`, `gcTime: 1000`) —
per-query overrides carry the real caching, notably the `songCache` preset for lyrics/YouTube/
Spotify lookups (immutable data, quota-limited APIs, `retry: false`).

`ArtistPage.jsx` handles the cold-start case: a shared link or refresh lands with empty context, so
it fetches the concert by URL id, then backfills the artist's full setlist + Ticketmaster data.

### Artist page layout

`ArtistPage.jsx` composes the cards; everything under `components/ArtistPage/` is one card.
`ConcertList.jsx` is the shared list shell — `LastConcerts` and `NextConcerts` both render through
it with `locationOf` / `linkOf` / `expand` callbacks rather than their own markup. `NextConcerts`
supplies an expanded row of three panels: `TicketOptions`, `HotelOptions`, `ConcertReminder`.
The first two render through `VendorTiles.jsx`, so tile sizing/alignment changes belong there, once.

Monetisation surfaces (ticket sellers, hotels) are affiliate-link targets. The comments naming why a
vendor was kept or dropped are load-bearing — read them before adding or removing one. Ticketmaster
publishes `priceRanges` for only a slice of its inventory, so every tile falls back to "Check price".

### Server routes

`server/http.js` is the shared fetch wrapper; every route uses it and reports errors as
`{ status, data }`. Routes: `ticketmaster` (suggest paginates up to 5 pages / 100 events, and
`/events` does the geo search), `setlist`, `spotify` (token exchange — the client never sees the
secret), `lyrics` (lrclib.net, keyless), `youtube`.

Server env: `TICKETMASTER_API_KEY`, `SETLISTFM_API_KEY`, `SPOTIFY_CLIENT_ID`,
`SPOTIFY_CLIENT_SECRET`, `YOUTUBE_API_KEY`, `PORT`.
Client env: `VITE_API_BASE`, `VITE_GOOGLE_MAPS_KEY`, `VITE_FORMSPREE_ID`,
`VITE_SPOTIFY_CLIENT_ID` (all set as GitHub secrets for the deploy).

New origins must be added to `allowedOrigins` in `server/index.js` or CORS blocks them.

### Spotify playlist flow

Auth code flow across a popup: `Setlist.jsx` stashes the songs in localStorage, opens
`getSpotifyAuthUrl()`, the popup lands on `/callback` (`SpotifyCallback.jsx`), exchanges the code
through the server, and `postMessage`s `SPOTIFY_AUTH_SUCCESS` back to the opener, which then creates
the playlist. State crosses the window boundary through localStorage, not props.

## Which process governs what

Two sets of instructions are active at once and pull in opposite directions: ponytail (stop at the
first rung that works, no unrequested abstractions) and the agent-skills workflows (spec first, TDD,
a written quality bar). The split, agreed with the owner:

- **Planning, review, testing, constraints** — the agent-skills workflows lead. This is where the
  project is genuinely uncovered: no lint, no CI, and the client has no tests at all.
- **Implementation** — ponytail leads. This is a ~3.5k-line app with two API calls and no database;
  scaffolding for a scale it will not reach is the failure mode it exists to prevent.

Where the two collide on a concrete decision, say so and let the owner pick instead of silently
following one. A spec or a test that ponytail would skip is not waste here; an interface with one
implementation still is.
