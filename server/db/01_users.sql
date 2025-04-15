-- CREATE DATABASE jwtauth;

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users(
  id SERIAL PRIMARY KEY NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_password VARCHAR(255) NOT NULL
);

GRANT ALL PRIVILEGES ON TABLE users TO labber;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO labber;

-- Run this command in psql once you are inside the server folder
-- \i ./db/01_users.sql
