DROP TABLE IF EXISTS favourites CASCADE;

CREATE TABLE favourites(
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) on DELETE CASCADE,
  artist_id INTEGER REFERENCES artists(id) on DELETE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE favourites TO labber;
GRANT USAGE, SELECT ON SEQUENCE favourites_id_seq TO labber;

-- Run this command in psql once you are inside the server folder
-- \i ./db/03_favourites.sql
