-- NEA 1889 staff membership (Issue #12, Phase 1).
--
-- Supabase Auth proves identity; this table decides authorization. A signed-in user may use the
-- reservation dashboard/API only when an ACTIVE row exists for their auth user id. Both roles may
-- manage reservations in Phase 1. Rows are created by controlled setup, never by the browser.
-- No Supabase API role (anon, authenticated, service_role) has any privilege on it.

CREATE TABLE nea.staff_members (
	user_id uuid PRIMARY KEY NOT NULL,
	email text NOT NULL,
	role text NOT NULL CHECK (role IN ('admin', 'staff')),
	active boolean NOT NULL DEFAULT true,
	created timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON nea.staff_members FROM PUBLIC, anon, authenticated, service_role;
-- Read-only for the application: membership is changed only by the migration identity.
GRANT SELECT ON nea.staff_members TO nea_runtime;

ALTER TABLE nea.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY runtime_read ON nea.staff_members FOR SELECT TO nea_runtime USING (true);
