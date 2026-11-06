# NEA 1889

Restaurant reservation app with a public booking form, personal reservation status and cancellation, and a staff management panel.

## Canonical deployment rule

The canonical public product is **https://nea1889.pizza** and its approved visual source is the Founder-owned Lovable implementation.

As of 2026-11-06:

- `nea1889.pizza` is served by Lovable. Vercel manages the domain/DNS only; do not change the Lovable A/TXT records or production routing without explicit Founder approval.
- The dedicated Supabase backend target is `nea1889Pizza` / `amfaldeqkqqovfggayoj` in Frankfurt (`eu-central-1`).
- Do not create, reuse, or connect backend services to ad-hoc Vercel test projects. There must be one explicitly approved canonical Vercel application project before any future Vercel runtime cutover.
- `nea-1889-reservations` and `nea-pizza-1889-preview` are obsolete test projects approved for deletion and must not be used again.
- `saint-gennaro-081` is an old editorial preview and is **not** the canonical NEA 1889 product. Do not use it for backend/runtime work unless the Founder explicitly re-authorizes it.
- Never move `nea1889.pizza`, change DNS, promote a Vercel deployment, or replace Production backend configuration without explicit Founder approval.

This rule takes precedence over older deployment notes in the repository.

## Stack and migration direction

The current repository uses Next.js, React and TypeScript. The backend migration is replacing Neon PostgreSQL and Clerk with Supabase PostgreSQL and Supabase Auth while preserving database-authoritative reservation integrity.

The approved visual experience comes from Lovable. Do not substitute legacy Vercel test designs for the approved Lovable product.

## Work together

Use this repository for source code, issues and the active roadmap. Make changes on a branch and open a pull request for review before merging into `main`.

The Founder alone decides when a pull request is merged. Do not enable auto-merge or push directly to `main`.

## Local development

Use Node.js 24. Run `npm ci`, copy `.env.example` to `.env.local`, configure development credentials privately, then run `npm run dev`. Never commit secrets.

Checks: `npm test`, `npm run typecheck`, `npm run build`.

## Current status

Supabase PostgreSQL migration work is tracked in the active roadmap. Production routing remains on the approved Lovable site until an explicit cutover decision is made.
