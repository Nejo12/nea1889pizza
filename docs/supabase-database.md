# Supabase PostgreSQL (Issue #11)

The reservation database is plain PostgreSQL reached from the Next.js server through the existing `postgres` driver. Atomic SQL, advisory locking and the occupancy primary key are unchanged. Supabase Auth is **not** part of this change (Issue #12); staff still sign in with Clerk.

## Layout

| Item | Where |
|---|---|
| Local config (database only, Data API off) | `supabase/config.toml` |
| Versioned schema | `supabase/migrations/*.sql` (single source of truth; replaces `database/schema.sql`) |
| Application schema | `nea` (not exposed through the Data API) |
| Pinned CLI | `supabase@3.0.0` via `npx` (no new project dependency) |

## Identities and privileges

| Identity | Used for | Connection | Variable |
|---|---|---|---|
| `postgres` (migration identity, owns `nea`) | `npm run db:migrate`, `npm run db:import` | direct or session pooler, port 5432 | `MIGRATION_DATABASE_URL` (local shell only, never in Vercel) |
| `nea_runtime` | the running app | transaction pooler, port 6543 | `DATABASE_URL` (server-side Vercel variable) |
| `anon`, `authenticated`, `service_role` | nothing | none | no privilege on `nea` |

`nea_runtime` may `SELECT/INSERT/UPDATE/DELETE` on `bookings`, `occupancy` and `blocked_days` only. It cannot run DDL, `TRUNCATE`, read the legacy `reservations` table, or create roles/schemas, and has a 15 s `statement_timeout`. RLS is enabled on all four tables with a policy for `nea_runtime` alone, so a mistaken grant to an API role still returns no rows. Direct SQL connections do not carry a user's RLS context: every staff route calls `isStaff` itself.

Database credentials are only read in `lib/database.ts`, which is imported by server routes. No `NEXT_PUBLIC_` variable carries database data, and `tests/database-config.test.cjs` guards that.

## First-time setup of a hosted project (needs Founder authorization)

1. Create or select an NEA-owned Supabase project in an EU region (decision D1 of the #10 audit). Confirm `SHOW server_version;` matches `major_version` in `supabase/config.toml`.
2. `MIGRATION_DATABASE_URL='<direct or session URL>' npm run db:migrate -- --dry-run`, review, then without `--dry-run`.
3. Set the runtime password once, in the SQL editor, never in git: `ALTER ROLE nea_runtime PASSWORD '<generated secret>';`
4. In Vercel (Preview first), set `DATABASE_URL` to `postgresql://nea_runtime.<project-ref>:<password>@<pooler-host>:6543/postgres` and `NEA_DATABASE_SCHEMA=nea`.
5. Keep **Settings → Data API** disabled, or leave `nea` out of the exposed schemas.

Builds no longer run migrations. `scripts/build.mjs` only runs `next build`.

## Local development and tests

```
npm run db:local          # starts the Supabase database container, applies migrations
npm test                  # starts an ephemeral PostgreSQL if initdb/pg_ctl are on PATH
NEA_TEST_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:54522/postgres npm test   # against the Supabase image
```

`tests/supabase-database.test.cjs` runs the real migration and exercises the real adapter and routes: column types and keys, runtime-role and API-role privileges, overlapping and adjacent bookings, capacity, concurrent confirms, repeated requests, blocked-day races, rollback of multi-statement batches, edit/cancel versus confirm races, and import of a synthetic legacy export (old token links keep working). Those tests skip with a message when no PostgreSQL is available.

## Integrity defect fixed here

`updateBooking` read the booking, then wrote occupancy in a later transaction. A staff edit or a guest cancellation in between let the confirm write occupancy for the old date/time or revive a cancelled booking. Each write is now guarded by the booking state that was read (status, date, time, guests, `updated`); a stale change writes nothing and is rejected with "Die Reservierung wurde zwischenzeitlich geändert". Tests 11 and 12 fail without this guard.

## Data migration and restore rehearsal (not yet run against real data)

No live data was touched. Rehearsal on an isolated target:

1. Export the Neon application schema only (`nea_migration_preview`; never `neon_auth`) with `pg_dump --data-only --schema=nea_migration_preview --column-inserts`, or the JSON shape accepted by `scripts/import-sites.mjs`. Use `pg_dump` of at least the source major version (Neon is 18.x; verify cross-version restore before trusting a dump).
2. Apply migrations to the target, then `MIGRATION_DATABASE_URL=… NEA_DATABASE_SCHEMA=nea npm run db:import -- <private-export.json>`. The importer is transactional, idempotent, aborts on conflicting rows and re-reads every row to verify. Never use `--clean` and never touch `auth`, `storage` or other Supabase-managed schemas.
3. Reconcile: row counts per table, `md5(string_agg(id||token_hash||status||table_ids, ',' ORDER BY id))` for `bookings`, orphan `occupancy` (no booking), duplicate `token_hash`, and that `date`/`time` text values are byte-identical (no timezone conversion happens; all values stay text).
4. Open an old status link against the target; it must resolve because only the SHA-256 of the token is stored.

The four existing booking rows still need Founder classification before any discard (audit PR #16).

## Provider-switch rollback

Neon and Clerk are untouched. Until cutover, rollback is: restore `DATABASE_URL` and `NEA_DATABASE_SCHEMA=nea_migration_preview` in Vercel and redeploy the previous deployment; the adapter works with either provider. After cutover, export any Supabase bookings created since (`pg_dump --data-only --schema=nea`) and import them into Neon before switching back, then keep Supabase read-only until reconciled.

## Transactional email (#19)

`lib/email.ts` sends pending / confirmed / cancelled emails through the Resend HTTP API (server-side only; no SDK).

- **Off by default.** Enabled only when `RESEND_API_KEY` and `EMAIL_FROM` are set (optional `EMAIL_REPLY_TO`). Activation on Production needs a verified sending domain (SPF/DKIM/DMARC) and Founder approval; this PR changes no DNS or hosting.
- **Exactly-once per event.** `nea.email_events` (migration `20261107140000`) holds one row per `<booking_id>:<kind>`; only the caller that claims the row sends, and the same value is the Resend `Idempotency-Key`. A `failed` row (or a `sending` claim older than 10 minutes) can be re-claimed by the same event; confirmed→cancelled→confirmed sends one confirmation. Only status, kind and timestamps are stored: no address, content or token.
- **Failure never touches bookings.** Sending runs after the booking transaction commits; errors are recorded as `failed` and swallowed.
- **Personal link.** Only the pending email contains it (the raw token exists only at submission; the database stores its hash). Confirmation/cancellation emails refer back to it.
- **Not included here (separate activation steps):** Supabase Auth invite/recovery delivery via Resend SMTP (configured in the Supabase dashboard / `supabase/config.toml` with a Resend SMTP key and verified domain), bounce/complaint webhooks, apply the migration to the hosted project.
