# NEA 1889 — Vercel migration candidate

This is an independently runnable Next.js application. It reuses the published reservation interface and assets, replacing ChatGPT authentication with Clerk and Cloudflare D1 with PostgreSQL. No ChatGPT service is required at runtime.

**Not yet the live production site. Do not move nea1889.pizza until the release checklist is complete and the owner authorizes it.**

## Setup

Node.js 24; `npm ci`. Copy `.env.example` to ignored `.env.local`, set values privately, then run `node --env-file=.env.local scripts/migrate.mjs` and `npm run dev`. For CLI scripts, `.env.local` is not loaded automatically; use Node's `--env-file` option. Run `npm test`, `npm run typecheck`, `npm run build`.

- Vercel project: https://vercel.com/neapizza1889/nea-1889-reservations
- Production, unchanged: https://nea1889.pizza
- GitHub repository: not identified or connected. Never invent a repository URL.
- Source baseline: Sites commit `0d1b3cacd8983fe36ce38316d19ddae71360db26`.

## Structure

`app/`: public reservations, personal status/cancellation, login and staff panel. `lib/`: booking rules, authentication and PostgreSQL adapter. `public/`: original logo, background and PWA assets. `database/schema.sql`: PostgreSQL schema. `scripts/`: schema setup and verified import. `tests/`: booking, auth and PostgreSQL tests. `docs/`: inventory, handover and release checklist.

## Environment

`DATABASE_URL` and Clerk keys are already provisioned by integrations in the existing Vercel project. Configure `STAFF_EMAILS` with verified primary emails, `AUTHORIZED_ORIGINS` with exact allowed origins, and `NEA_DATABASE_SCHEMA` with the reviewed schema. An empty staff list denies access. Preview automatically accepts its exact `VERCEL_URL`; it does not accept every vercel.app origin.

Preview builds initialize only `nea_migration_preview`. This is a separate schema on the connected database, not a separate database or Neon branch. No real reservations are imported by the build. Production builds do not run database migrations. Prefer a dedicated Neon preview branch for ongoing development.

See `docs/GABRIEL.md`, `docs/INVENTARIO.md`, and `docs/RILASCIO.md`.
