# Issue #21 — Lovable integration preparation (2026-11-06)

> **Superseded in part (2026-11-06):** the Founder decided that this Next.js application is the canonical runtime and the Lovable project is a design/reference source. The frontend is ported here (see `docs/frontend-migration.md`); the "generated copy in the Lovable repo" mechanism below is no longer the plan. Kept for its findings (strict TypeScript, Workers connection handling, pooler test plan).

Refs #21, builds on #23 (merged, runtime proof). No Production, DNS, Supabase, Lovable-`main` or provider change. Nothing here mounts a route or alters the live reservation UI.

## Decision: single source here, generated copy there

| Option | Verdict |
| --- | --- |
| Git submodule / nested repo | **Rejected.** Lovable's GitHub docs describe one synced branch and say nothing about submodules, subdirectories or external source; behaviour is unverified and a failure would break the editor sync. Not necessary. |
| Package registry / monorepo tool | Rejected: new infrastructure for four files. |
| Move the engine into the Lovable repo and delete it here | Rejected for now: the migrations, the PostgreSQL integration tests and the legacy Next app live here; Lovable's `AGENTS.md` forbids `supabase/migrations/` and `drizzle/` in its repo, so tests could not run against the schema there. |
| **Plain files in the Lovable repo, generated from this repo** | **Chosen.** Ordinary source for Lovable's sync/build; zero Git tricks. |

`scripts/sync-lovable.mjs --target <lovable-checkout>` writes `src/server/booking/{database,reservation-rules,booking-store,guest-api}.ts`. The only transformations are a `GENERATED … DO NOT EDIT` header with source and output SHA-256, `zod` → `zod/v4`, `@/lib/x` → `./x`, and `staff` → `./database` (and only if `database` is the sole import: Clerk/auth cannot enter the copy; unknown imports throw). `--check` fails when the copy is missing, hand-edited or stale. In the Lovable repo a vitest verifies each file's output hash, that only API route files may import the engine, and the zod boundary. Reservation rules, SQL and handlers are therefore edited in exactly one place; migrations stay here.

Workflow for any later change: edit here → `npm test` → `node scripts/sync-lovable.mjs --target …` → PR in the Lovable repo → Founder merges → Lovable syncs. When the legacy Next app is retired (final step of the delivery order) the engine can move wholesale to the Lovable repo with a one-line change to this decision.

## Findings (all reproduced locally)

1. **Stricter TypeScript.** Lovable compiles with `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`. The engine had 8 errors (env/body property access, `batch()[0]`). Fixed at the source with behaviour-neutral edits (`process.env['X']`, `raw['website']`, `[0]!`); both repos now typecheck.
2. **Lint/format.** Lovable's ESLint/Prettier reformat generated code, so `src/server/booking` is excluded from both (the repo already has 500+ unrelated lint findings; not touched).
3. **Workers detection hardened.** Detection was `userAgent === 'Cloudflare-Workers'`. It now fails safe: only a positively identified Node.js (`navigator.userAgent` starts with `Node.js/`) keeps a pooled client; every other runtime opens and closes a connection per operation. (`process.release.name` is not used: `nodejs_compat` can report `node` inside workerd.) Unit-tested for both branches.
4. **Zod boundary.** Lovable pins `zod ^3.25.76`, which ships the v4 API at `zod/v4`; importing that gives the semantics the engine was tested with and needs no change to Lovable's dependencies or its forms. Verified: the same 12 accept/reject cases give identical results under zod 4.6.7 here and 3.25.76 `zod/v4` there.
5. **Server-only.** With a throwaway route mounted, a real `vite build` produced a client bundle (`.output/public`) containing none of `DATABASE_URL`, `pg_advisory_xact_lock`, `cloudflare:sockets`, `nea_runtime`, `token_hash`; the engine appears only under `.output/server`. Only a route's `server.handlers` reference it.
6. **Runtime.** Built Lovable worker under `wrangler dev` against a throwaway PostgreSQL as `nea_runtime`: home 200; create/replay/replay 201/200/200; status 200; 8 parallel creates 201; cancel 200. With `DATABASE_URL` absent: booking → controlled 503 (no secret/stack in body), site still 200.
7. **Dependency.** The Lovable repo gains one runtime dependency, `postgres@3.4.7` (exact, same as here), added with Lovable's package manager (bun) so `bun.lock` stays authoritative.
8. **Still open (not testable offline):** how Lovable injects secrets into its published Worker, and whether Lovable offers a non-Production publish.

CORS/CSRF: the `Origin` check and body limits are implemented (#13, see `docs/frontend-migration.md`); rate limiting is still pending (PR A2).

## Plan: non-Production Supabase transaction-pooler test

Goal: prove TLS over `cloudflare:sockets`, Supavisor transaction pooling (`SET LOCAL search_path`, advisory lock, `prepare:false`) and the race behaviour against a real hosted pooler, with **zero Production contact**.

**Founder decisions needed first**
- Target (pick one): (a) a Supabase *branch* of `amfaldeqkqqovfggayoj` (isolated DB, migrations replayed, deleted afterwards; may have cost), or (b) a new throwaway Supabase project in `eu-central-1` (the AGENTS rule requires explicit approval). Do **not** use a schema inside the Production database.
- Approval to run `supabase db push` against that target only.

**Steps (executed by Claude Code after approval)**
1. Create the target; record its project ref `T`. Abort unless `T != amfaldeqkqqovfggayoj`; every command below is preceded by this guard (script compares the ref parsed from each URL).
2. Apply `supabase/migrations/*` to `T` using its direct/session URL (port 5432) from an untracked `.env.preflight` (matches the ignored `.env*`). No Production variable is ever exported in that shell.
3. In `T` only: `ALTER ROLE nea_runtime PASSWORD '<openssl rand -base64 32>'`; build `postgresql://nea_runtime.T:<pw>@<pooler-host>:6543/postgres`.
4. Secret injection for the test: the URL goes to the worker only via `wrangler dev --var` / a gitignored `.dev.vars` (added to `.gitignore`); never into git, CI logs, PR text or a browser bundle. Tests assert the password is absent from all responses.
5. Run the existing suite in `tests/workerd/runtime.mjs` pointed at `T` (small addition: read the runtime/admin URLs from env instead of creating a local database; same 9 assertions), plus: median/p95 request latency, `pg_stat_activity` connection count after a 50-request burst (must return to baseline: proves per-request `end()`), and a 15 s `statement_timeout` check.
6. Cleanup: delete the branch/project (Founder-approved), delete `.env.preflight` and `.dev.vars`, confirm no secret in `git status`/history, and attach the guard output showing only `T` was contacted.

**Zero-impact guarantees:** Production ref blocked by guard; no Production credentials in the environment; no migrations against any hosted environment except the approved `T`; no Lovable publish, DNS or secret change.

## After this PR

1. Founder merges this PR and, separately, the Lovable-repo PR that adds the generated engine (unmounted: no behaviour change).
2. Founder approves target `T`; run the plan above.
3. Mount the three guest handlers as a TanStack server route in a further Lovable-repo PR (#13) once Lovable's secret injection is confirmed.
