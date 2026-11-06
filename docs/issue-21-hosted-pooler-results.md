# Issue #21 — Hosted Supabase transaction-pooler verification (2026-11-06)

Target: temporary Preview branch `nea-issue21-pooler-preflight`, project ref `lyichglmkpeyyajkyucz` (branch ID `bfe4fbcf-886c-458c-93e7-bab6fac22bc8`), `aws-1-eu-central-1`, Postgres 17.11. Production `amfaldeqkqqovfggayoj` was never connected to, queried or modified; every connection URL was guarded (see Safety). Credentials live only in the gitignored `.env.preflight`.

## Result in one line

Everything about the pooler works for the booking engine **except TLS trust**: workerd rejects the pooler's certificate because it chains to Supabase's private root CA. This is a blocker for direct `postgres` → pooler connections from Cloudflare Workers unless the runtime trusts that CA (not possible on the Cloudflare edge as far as documented).

## Evidence

| Check | Result |
| --- | --- |
| Identity | `current_database=postgres`, user scoped `postgres.lyichglmkpeyyajkyucz`, Postgres 17.11 |
| Migration | **Already present** (branch creation replays migrations): `20261105160000 nea_reservation_schema`, the only history row. Its statements equal `supabase/migrations/20261105160000_nea_reservation_schema.sql` (whitespace/terminator-insensitive). Nothing was applied by this work. |
| Data | `nea.bookings/occupancy/blocked_days/reservations` = 0 rows, `auth.users` = 0, no `public` tables → no Production customer data. Same after the suite (self-scrubbed). |
| Roles | `nea_runtime`: login, not superuser/createrole/createdb/bypassrls, `statement_timeout=15s`; SELECT/INSERT/UPDATE/DELETE on `bookings`,`occupancy`,`blocked_days` only; no privilege for `anon`/`authenticated`/`service_role` on `nea`; RLS on for all four tables. Its password was unset on the branch; a random one was set on Preview only. |
| Hosted suite (Linux container, workerd, Supabase root CA trusted) | **12/12**: all 9 local-parity tests (idempotent replay, 8 parallel identical submissions → 1 row, racing overlapping confirmations → exactly one wins and 5 occupancy rows, adjacent/different tables, blocked day, abuse limits, privilege denial, no secret in any response) plus 3 pooler tests below |
| `SET LOCAL search_path` | 30 worker probes all `nea`; 6 independent clients × 10 alternating transactions/bare statements: a bare statement never saw `nea` (no leak across pooled backends) |
| `statement_timeout` | 15 s enforced through the pooler (20 s sleep cancelled) |
| Connection cleanup | 60-request burst: `nea_runtime` backends 8 → 10, bounded by Supavisor's pool, not by request count. Latency from a Europe-based container: p50 ≈ 330 ms, p95 ≈ 400–420 ms per request (includes a fresh TLS handshake each time) |
| Local parity | `npm run test:workerd` 9/9 (3 hosted tests skipped), `tsc`, `npm test` and `npm run build` pass |

## Findings

1. **BLOCKER — TLS trust.** The pooler certificate (`*.pooler.supabase.com`, valid Mar 2025–Mar 2030) chains to `Supabase Root 2021 CA`, which is not publicly trusted. workerd fails with `UnknownIssuer` on Linux and `certificate is not standards compliant` on macOS (validity > 398 days). Node and `psql` with `sslmode=require` / `ssl:'require'` do not verify, so they never noticed. The runtime performs the check against Cloudflare's trust store and exposes no setting for custom CAs ([Cloudflare docs](https://developers.cloudflare.com/workers/databases/connecting-to-databases/), [workers-rs#386](https://github.com/cloudflare/workers-rs/issues/386)). The suite passes only when the published root (SHA-256 `80:70:25:AD:…:CA:FA`, matching the root the pooler presents) is added to the container's trust store, which is impossible on the Cloudflare edge. I could not test the real edge without deploying; treat it as failing until proven otherwise.
2. **Supabase does not require TLS to the pooler.** A `sslmode=disable` connection was accepted; `ssl-enforcement` is `database:false` on Preview. Today TLS rests solely on the driver option `ssl:'require'` (unit-tested). Enable "Enforce SSL" on Production before cutover (Founder action; not checked on Production here).
3. **Do not pipeline statements on one pooled connection.** Ten concurrent bare statements on a single connection stall through the transaction pooler (sequential use and many one-connection clients are fine). The adapter is safe because each operation is its own `begin` on its own connection; keep it that way (no `Promise.all` on one client).
4. **Harness bug fixed:** the `wrangler` process tree outlived the test; it is now spawned detached and its process group is killed.

## Options for the TLS blocker (Founder decision; none implemented)

| Option | Notes |
| --- | --- |
| A. Cloudflare Hyperdrive | Cloudflare's own Postgres connector; the Worker talks to a binding, Hyperdrive talks TLS to Supabase. Needs a Cloudflare account/binding that Lovable's managed publishing may not expose. |
| B. Supabase HTTPS API (supabase-js / PostgREST RPC) | Public certificate, works on Workers. Booking logic moves into SQL functions (single transaction per call), so the TypeScript engine is not reused as is. |
| C. Run the engine as a Supabase Edge Function in the existing project | Deno can trust extra CAs; the Lovable app calls it over HTTPS. Adds a hosted component inside the existing Supabase project (no new vendor). |
| D. Keep a Node host for the engine | Excluded by earlier direction (no new Vercel project). |

My recommendation: confirm first, with a one-off Preview publish if Lovable offers one, whether the real edge also rejects the chain; if it does, choose between A and C.

## Safety

- Guard in `tests/workerd/runtime.mjs` aborts if any `PREFLIGHT_*`, `DATABASE_URL` or `MIGRATION_DATABASE_URL` value contains the Production ref, if the ref equals Production, if the URL user is not scoped to the Preview ref or not `nea_runtime`, or if the runtime URL is not the transaction pooler (port 6543). Both abort paths were exercised.
- The suite refuses to run if the target holds any row dated outside its synthetic dates, and scrubs only those dates.
- No migration, reset, rebase, merge or deletion was run; no Lovable publish or secret was touched.
- **Credential exposure:** the Preview branch credentials were printed once to this session's terminal output while discovering the connection details. They are Preview-only; rotate or delete the branch.

## Reproduce

```
# .env.preflight (gitignored): NEA_PREFLIGHT_REF, PREFLIGHT_ADMIN_URL (session pooler :5432, postgres.<ref>),
#                              PREFLIGHT_POOLER_HOST, PREFLIGHT_RUNTIME_URL (transaction pooler :6543, nea_runtime.<ref>)
tests/workerd/preview-docker.sh        # Linux + published Supabase CA (passes 12/12)
npm run test:workerd:preview           # host workerd: fails at TLS trust (finding 1)
```
