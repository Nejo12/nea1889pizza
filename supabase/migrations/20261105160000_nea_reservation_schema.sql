-- NEA 1889 reservation schema for Supabase PostgreSQL (Issue #11).
--
-- Tables, column names, types and keys are carried over unchanged from the Neon
-- schema (database/schema.sql) so existing booking ids, token hashes, statuses,
-- table assignments, occupancy keys and blocked days import without conversion.
-- Dates/times stay text on purpose: changing types would alter business rules.
--
-- Guest PII lives only in the `nea` schema. It is not exposed through the Data API
-- and no Supabase API role (anon, authenticated, service_role) has any privilege on it.
-- The application connects as `nea_runtime`, a least-privilege role without DDL rights.
-- Schema changes are applied by the migration identity (`postgres`) only.

CREATE SCHEMA IF NOT EXISTS nea;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE nea.blocked_days (
	id text PRIMARY KEY NOT NULL,
	owner text NOT NULL,
	date text NOT NULL
);

-- Legacy table from the first application version. Kept (never discard confirmed
-- data) until the Founder classifies the rows; current code does not use it.
CREATE TABLE nea.reservations (
	id text PRIMARY KEY NOT NULL,
	owner text NOT NULL,
	name text NOT NULL,
	email text NOT NULL,
	phone text NOT NULL,
	date text NOT NULL,
	time text NOT NULL,
	guests integer NOT NULL,
	notes text NOT NULL,
	status text NOT NULL,
	created text NOT NULL
);

CREATE TABLE nea.bookings (
	id text PRIMARY KEY NOT NULL,
	token_hash text NOT NULL,
	name text NOT NULL,
	email text NOT NULL,
	phone text NOT NULL,
	date text NOT NULL,
	time text NOT NULL,
	guests integer NOT NULL,
	notes text NOT NULL,
	status text NOT NULL,
	table_ids text DEFAULT '[]' NOT NULL,
	duration integer DEFAULT 75 NOT NULL,
	created text NOT NULL,
	updated text NOT NULL
);

-- One row per table and 15-minute slot. The primary key (date:table:minute) is the
-- atomic overlap guard: two confirmations for the same table and slot cannot both commit.
CREATE TABLE nea.occupancy (
	id text PRIMARY KEY NOT NULL,
	booking_id text NOT NULL,
	table_id text NOT NULL,
	date text NOT NULL,
	minute integer NOT NULL
);

CREATE INDEX bookings_date_time ON nea.bookings(date,time);
CREATE INDEX bookings_token ON nea.bookings(token_hash);
CREATE INDEX occupancy_booking ON nea.occupancy(booking_id);

-- ---------------------------------------------------------------------------
-- Runtime role
-- ---------------------------------------------------------------------------
-- LOGIN without a password cannot authenticate. The password is set once, out of band,
-- and is never stored in this repository:
--   ALTER ROLE nea_runtime PASSWORD '<generated secret>';

DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nea_runtime') THEN
		CREATE ROLE nea_runtime LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
	END IF;
END
$$;

-- Fail fast instead of holding pooled connections when a statement hangs.
ALTER ROLE nea_runtime SET statement_timeout = '15s';

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

REVOKE ALL ON SCHEMA nea FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA nea FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA nea FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA nea FROM PUBLIC, anon, authenticated, service_role;
-- Future objects created by the migration identity must not leak to API roles either.
ALTER DEFAULT PRIVILEGES IN SCHEMA nea REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nea REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nea REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

-- The runtime role gets data access only: no DDL, no TRUNCATE, no REFERENCES/TRIGGER,
-- and no access to the legacy `reservations` table.
GRANT USAGE ON SCHEMA nea TO nea_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON nea.bookings, nea.occupancy, nea.blocked_days TO nea_runtime;

-- ---------------------------------------------------------------------------
-- Row level security (defence in depth)
-- ---------------------------------------------------------------------------
-- Every table has RLS enabled. Only nea_runtime has a policy, so any role that is
-- later granted access by mistake still sees no rows. The table owner (migration
-- identity) bypasses RLS, which keeps migrations and restores working.

ALTER TABLE nea.blocked_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE nea.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nea.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nea.occupancy ENABLE ROW LEVEL SECURITY;

CREATE POLICY runtime_access ON nea.blocked_days FOR ALL TO nea_runtime USING (true) WITH CHECK (true);
CREATE POLICY runtime_access ON nea.bookings FOR ALL TO nea_runtime USING (true) WITH CHECK (true);
CREATE POLICY runtime_access ON nea.occupancy FOR ALL TO nea_runtime USING (true) WITH CHECK (true);
-- nea.reservations intentionally has no policy: the runtime role cannot read it.
