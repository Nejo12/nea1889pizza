# NEA 1889

Restaurant reservation app with a public booking form, personal reservation status and cancellation, and a staff management panel.

**Stack:** Next.js, React, TypeScript, PostgreSQL (Supabase; see [docs/supabase-database.md](docs/supabase-database.md)) and Clerk authentication. Hosted on the existing [Vercel project](https://vercel.com/neapizza1889/nea-1889-reservations).

## Work together

Use this repository for source code, [issues and the roadmap](https://github.com/Nejo12/nea1889pizza/issues/2). Make changes on a branch and open a pull request for review before merging into `main`.

## Local development

Use Node.js 24. Run `npm ci`, copy `.env.example` to `.env.local`, start a local database with `npm run db:local`, configure Clerk credentials privately, then run `npm run dev`. Never commit secrets.

Checks: `npm test`, `npm run typecheck`, `npm run build`.

## Current status

The application is available as a Vercel preview; the production migration is not complete. The Supabase database migrations and adapter are in the repository (Issue #11); no hosted Supabase project is provisioned and Production still uses the existing backend. Clerk remains until [Issue #12](https://github.com/Nejo12/nea1889pizza/issues/12).
