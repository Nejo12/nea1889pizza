# Issue #21 — Canonical integration audit (2026-11-06)

Status: **AUDIT ONLY — integration runtime not yet verified.** No Production changes.

## Verified repositories and publication

| Role | Repository / project | Verified state |
| --- | --- | --- |
| Live approved Lovable UI | Nejo12/nea-naples-table-booking (private) | main at 77fda2203f6b4d45050252425f73807cc8705feb, containing approved Lovable edit 8e53de56ec688babd5a075ddb3ff03a4b5e48af7 |
| Booking/database foundation | Nejo12/nea1889pizza (public) | main at ffc95502c095c254ef9e49d488d33ad948741ef7; PR #17 merged |
| Lovable editor | Project ab59382d-5213-4a89-a21e-00de41f6afca | GitHub commit history matches private repository |
| Database | Supabase project amfaldeqkqqovfggayoj (Frankfurt) | Reservation migration applied per prior verified audit; runtime cutover is not complete |
| Public domain | nea1889.pizza | Existing Lovable publishing and DNS must remain unchanged |

The repositories are separate, independently structured apps. The existing Next.js API is **not automatically available** to the live TanStack Start UI. Do not rename, disconnect or delete the synced Lovable repository, nor recreate removed Vercel projects.

## Exact source map

| Capability | Lovable TanStack Start | Existing Next.js |
| --- | --- | --- |
| Homepage/site chrome | src/routes/index.tsx; src/components/site/SiteChrome.tsx | app/page.tsx; app/layout.tsx |
| Menu/styles/approved assets | src/routes/menu.tsx; src/lib/menu-data.ts; src/styles.css; src/assets/brochure/* | older app/globals.css and public assets |
| Five-step booking UI | src/routes/reservierung.tsx | app/booking-form.tsx |
| Reservation rules / storage | src/lib/reservations.ts (localStorage demo) | lib/reservation-rules.ts; lib/booking-store.ts (server-side booking/occupancy) |
| Guest API/status/cancellation | No authoritative guest API | app/api/booking/*; app/api/reservations/* |
| Staff UI/auth/API | src/routes/staff.tsx (demo) | app/admin/*; app/api/staff/*; lib/clerk-staff.ts |
| i18n/legal | src/lib/i18n*; src/routes/impressum.tsx; src/routes/datenschutz.tsx | existing older UI |
| Database foundation | Not implemented as real backend | supabase/migrations/* and tests |

Lovable demo storage uses localStorage, six-character demo tokens, 40-seat global capacity and hardcoded Pranzo/Cena shifts. These are not approved substitutes for the server reservation rules and occupancy constraints.

## Proposed architecture and unresolved runtime gate

Required final path:

Guest: nea1889.pizza -> approved Lovable UI -> trusted server API -> Supabase PostgreSQL.

Staff later (#12 and #14): Supabase Auth -> protected API -> same authoritative records.

Mail later (#19): server-authoritative booking event -> Resend.

Keep approved Lovable visuals and assets; keep PostgreSQL transactional conflict enforcement. GitHub must control the final deployed application. A single canonical deployable repository is **not yet achieved**.

Before code migration, test one of these narrow options:

1. Adapt existing booking domain/database logic to Lovable's TanStack Start server runtime, with a proven server-only database client, least-privilege nea_runtime role, safe transaction pooling and preserved atomic occupancy operations. Do not rewrite business rules independently.
2. Use a separately authorized already-existing trusted API runtime, if one exists and is proven. Audit its host, origin controls, secrets, deployment, rate limits and available non-Production verification. Do not create a new Vercel application or use obsolete editorial preview.

Neither is presently proven. Do not assert that the Node/Postgres server code can run unchanged under Lovable's Cloudflare runtime.

## Security and release checks

- Browser: only public UI/API configuration; never database passwords, service-role secrets, migration credentials, Auth secrets or Resend keys.
- Trusted server: runtime database URL for nea_runtime only; migration URL for migrations only.
- Preserve blocked days, reservation state transitions, token privacy, concurrency uniqueness, stale-change handling and idempotency.
- For local or approved disposable test environment: run overlapping booking and cancellation tests with synthetic reservations; verify failed/unauthorized cases, token secrecy, origin controls, TS/build, responsive UI and accessibility.
- Verify Lovable GitHub active branch, editor sync and publication separately; a repository merge does not itself certify the live website was published.
- Require Founder approval before any hosted runtime provisioning, credentials change, Production publication, domain cutover or provider retirement.

## Next bounded implementation

Prove and choose the trusted API runtime with an isolated smoke test that does not touch Production. Then reconcile approved Lovable UI with reusable booking logic into one maintainable, GitHub-controlled deployment structure, and open a reviewed implementation PR referencing #21.

Do not advance wholesale to #12, #13, #14 or #19 in this task. The cosmetic prototype-banner removal was separately approved and is handled in Lovable repository PR #1.

**Acceptance remains incomplete until one source/runtime path is actually tested and independently verified.**
