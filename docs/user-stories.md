# 🎯 Project Description
ConcertFYI2000 is a web application that allows users to explore, track, and engage with their favorite music artists through past and upcoming concerts, setlists, maps, and ticket purchasing options — with additional features for authenticated users like saving favorites, generating Spotify playlists, and receiving notifications.

## 👥 User Types
### 🔓 Non-Authenticated Users
✅ Can search for any artist.

✅ List of upcoming concerts (from Ticketmaster).

✅ List of past concerts (from Setlist.fm).

✅ Setlists and detailed info per concert.

✅ Interactive map of concert locations.

✅ Can click to purchase tickets via Ticketmaster (affiliate link).

⬜ Can see merch suggestions (t-shirts, vinyls, etc.).

✅ - Can preview songs via embedded Spotify.

### 🔐 Authenticated Users - all features above, plus:
✅ Can add/remove artists to their favorites.

⬜ Can create Spotify playlists based on setlists from specific concerts.

⬜ Can receive notifications about favorite artists

⬜ Can receive notifications about new concerts added near user’s location.

⬜ Can create their own concert map (My Map), saving past/future concerts they’re interested in.

⬜ Can optionally follow other users and see their favorite artists.

⬜ Can share links to favorite setlists or maps.

## 🧩 Nouns / Key Entities
- Users, Artists, Concerts, Setlists, User Favorites, User Map, Artist Map, Tickets, Merch.

## 🛣️ Main Routes
✅ / → Home / Featured Artists

✅ /search/:term → Search Results

⬜ /artist/:id → Artist Profile (bio + map + setlists)

⬜ /concert/:id → Concert Details (info + setlist + ticket link)

⬜ /favourites → Authenticated user's favorite artists

⬜ /mymap → User’s personal concert map

⬜ /login / /signup → Auth

⬜ (Optional) /user/:username → Public profile page with shared favorites/map

## 💡 New Ideas for Expansion
✅ Integration with Spotify for playlist generation

✅ Integration with Ticketmaster for tickets

⬜ Integration with Merchbar for merch recommendations

⬜ “Follow” system between users

⬜ Rating system for concerts/setlists

⬜ Comments or tags on specific shows

⬜ Widget embeddable on external sites ("Where is [artist] playing next?")

## 🚀 MVP Scope (Minimum Viable Product)
✅Search for artists

✅ First upcoming concert

✅ Most recent past concert

✅ Setlists and concert details

✅ Ticket link (affiliate-ready)

✅ Save favorite artists (auth required)

✅ Display interactive map of concerts
