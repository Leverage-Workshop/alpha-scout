-- Enables TimescaleDB in the application database.
-- The server must already ship the extension (local: timescale/timescaledb image; prod: Aiven).
CREATE EXTENSION IF NOT EXISTS timescaledb;
