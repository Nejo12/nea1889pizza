# Issue #21 — Trusted API runtime proof (2026-11-06)

Refs #21 (builds on the audit in PR #22). No Production, DNS, Supabase, Lovable or provider change was made. All data was synthetic, in throwaway local PostgreSQL.

## Conclusion

**Recommended runtime: run the existing booking code inside the Lovable TanStack Start server (Cloudflare Workers / `workerd`), unchanged except for one adapter fix.** No new host, project or vendor is needed, and the PostgreSQL guarantees (advisory lock, occupancy primary key, guarded writes) are untouched because the SQL never moves.

Proven locally:

| Question | Result |
| --- | --- |
| Does `postgres@3.4.7` run in `workerd`? | Yes. The package's `workerd` export condition selects the `cloudflare:sockets` build (present in the Lovable Nitro bundle). Needs `nodejs_compat`, which Lovable's generated `wrangler.json` already sets. |
| Does `lib/database.ts` work as is? | **No.** The module-level cached client is reused by the next request, which Workers forbid (cross-request I/O). Observed: request 1 → 201, request 2 → 503. |
| Fix | On Workers only, open and close a connection per operation (`max:1`). Node keeps the existing 3-connection pool. Same SQL, same transactions, same `SET LOCAL search_path`, same advisory lock. |
| Transactions / conflicts | In `workerd`: parallel identical submissions → one row; two overlapping confirmations racing for one table → exactly one wins and exactly 5 occupancy rows exist; adjacent slots and different tables both succeed; blocked day → 409. |
| Least privilege | Inside the worker the connection is `nea_runtime`, `search_path=nea`; DDL, `TRUNCATE`, legacy `reservations` read and `CREATE ROLE` are all denied. |
| Secrets | `DATABASE_URL` is read only server-side. No response body or header contained the password or URL, including error paths. The browser bundle imports nothing from `lib/database.ts`. |
| Mounting in Lovable | A throwaway (uncommitted) TanStack Start server route calling the unmodified `GET/POST/PATCH` handlers built with the real `vite build` (Nitro Cloudflare preset). Served by `wrangler dev` against local PostgreSQL: `/` and `/reservierung` → 200; create 201, replay 200, status 200, cancel 200, 6 parallel distinct creates all 201. |

Run: `npm run test:workerd` (opt-in, needs network for `npx wrangler@4.158.0`, and `initdb`/`pg_ctl` or `NEA_TEST_ADMIN_URL`). `npm test` gains one offline unit test for the new branch.

## Comparison with an external API runtime

No already-existing, authorized API runtime was found. The Next.js app in this repository has no live host (its Vercel projects were deleted and must not be recreated), so the alternative would be provisioning something new, which is excluded. An external API would also add a second origin, so CORS/CSRF handling, a second secret store and a second deploy path. The in-Lovable runtime is simpler to operate and keeps one origin (`nea1889.pizza`).

## Not proven (honest limits)

1. **Hosted path untested.** Tests used a direct local PostgreSQL connection. TLS via `cloudflare:sockets` `startTls` against the Supabase transaction pooler (port 6543, user `nea_runtime.<ref>`) is not exercised, because that needs Production credentials, which were out of scope. Must be verified once on a Founder-approved non-Production Supabase target before cutover.
2. **How Lovable injects `DATABASE_URL`.** Lovable manages secrets itself; confirm that its published Worker exposes them via `process.env` (the proof uses `nodejs_compat` populating `process.env`) or adapt `open()` to read the binding. Founder/Lovable-editor action.
3. **Source sharing.** The booking code lives here; the app that serves it lives in `nea-naples-table-booking`. Pick one mechanism (git submodule, or move the Lovable app source here) before #13. The scratch copy used for the proof is *not* a proposal: copying would duplicate reservation logic. Lovable's own `AGENTS.md` forbids `supabase/migrations/` or `drizzle/` in that repo, so migrations stay here.
4. **Dependency drift.** Lovable pins `zod@^3`, this repo `zod@4.6.7`. The schemas used (`uuid`, `email`, `refine`, `object`) compiled and ran under both here, but unify before #13.
5. Staff routes (`isStaff`, Clerk) were not run in `workerd`; Clerk is being replaced in #12.

## CORS / CSRF notes for #13

- The guest API sends no CORS headers; its `X-Booking-Token` + JSON body forces a preflight, so third-party sites cannot call it from a browser. Same-origin from the Lovable UI works.
- No ambient credentials (cookies) are used by the guest API, so classic CSRF has nothing to ride on; abuse is spam, mitigated by the honeypot, consent, 12 kB limit and the 5-pending-per-email cap. Add an `Origin` check and rate limiting when the route is mounted.
- TanStack Start's `createCsrfMiddleware` in the Lovable `src/start.ts` is filtered to **server functions only** (`handlerType === "serverFn"`); it does not cover raw server routes. Staff routes (#12/#14) must authenticate by bearer token or add an explicit `Origin` check if they ever use cookies.

## Smallest next action (#13 handoff)

Decide the source-sharing mechanism (item 3), then mount `app/api/booking/route.ts` handlers as TanStack server routes in a Lovable-repo PR and verify against a non-Production Supabase project (item 1).
