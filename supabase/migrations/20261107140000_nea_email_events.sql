-- NEA 1889 transactional email event log (Issue #19).
--
-- One row per (booking, event kind): id = '<booking_id>:<pending|confirmed|cancelled>'. The primary key is the
-- duplicate guard: only the caller that claims the row sends the email. Holds NO recipient address, content or
-- token, only the minimum delivery state for support/audit. Email failures are recorded here and never touch bookings.
CREATE TABLE nea.email_events (
	id text PRIMARY KEY NOT NULL,
	booking_id text NOT NULL,
	kind text NOT NULL CHECK (kind IN ('pending', 'confirmed', 'cancelled')),
	status text NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
	created text NOT NULL,
	updated text NOT NULL
);
CREATE INDEX email_events_booking ON nea.email_events(booking_id);

REVOKE ALL ON nea.email_events FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON nea.email_events TO nea_runtime;

ALTER TABLE nea.email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY runtime_access ON nea.email_events FOR ALL TO nea_runtime USING (true) WITH CHECK (true);
