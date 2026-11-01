CREATE TABLE IF NOT EXISTS blocked_days (
	id text PRIMARY KEY NOT NULL,
	owner text NOT NULL,
	date text NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
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

CREATE TABLE IF NOT EXISTS bookings (
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

CREATE TABLE IF NOT EXISTS occupancy (
	id text PRIMARY KEY NOT NULL,
	booking_id text NOT NULL,
	table_id text NOT NULL,
	date text NOT NULL,
	minute integer NOT NULL
);

CREATE INDEX IF NOT EXISTS bookings_date_time ON bookings(date,time);
CREATE INDEX IF NOT EXISTS bookings_token ON bookings(token_hash);
CREATE INDEX IF NOT EXISTS occupancy_booking ON occupancy(booking_id);
