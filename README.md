# NEA 1889

NEA 1889 is the restaurant website and reservation platform for **https://nea1889.pizza**.

## Canonical product and hosting rule

The canonical public product is **https://nea1889.pizza**. Its approved visual implementation is the Founder-owned Lovable version currently serving the live domain.

As of 2026-11-06:

- `nea1889.pizza` is served by Lovable.
- Vercel manages the domain/DNS only. Do not change the Lovable A/TXT records or production routing without explicit Founder approval.
- The dedicated Supabase backend target is `nea1889Pizza` / `amfaldeqkqqovfggayoj` in Frankfurt (`eu-central-1`).
- Obsolete Vercel test projects `nea-1889-reservations` and `nea-pizza-1889-preview` were deleted on 2026-11-06 and must not be recreated or reused.
- `saint-gennaro-081` is an old editorial preview and is **not** the canonical NEA 1889 product.
- Do not create or attach backend work to ad-hoc Vercel projects. Any future Vercel application runtime must be explicitly approved as the single canonical runtime before cutover.
- Never move `nea1889.pizza`, change DNS, promote a deployment, or replace Production backend configuration without explicit Founder approval.

## Production hosting vs proposed deployment

- **Production today:** Lovable serves `nea1889.pizza` (demo, browser-local reservations). Unchanged.
- **Proposed:** this repository's Next.js application becomes the single canonical product (approved Lovable UI ported in, Supabase-backed booking API unchanged). The host is not chosen and nothing is deployed; cutover requires explicit Founder authorization. Details and remaining work: `docs/frontend-migration.md`.

## Approved target architecture

The completion target is:

- **Frontend / public experience:** the current approved Lovable implementation on `nea1889.pizza`.
- **Database:** Supabase PostgreSQL. Reservation state must be server-authoritative; browser `localStorage` must not be the booking database.
- **Staff authentication:** Supabase Auth, replacing Clerk.
- **Reservation integrity:** PostgreSQL transactions/constraints remain the final authority for availability, confirmation and occupancy conflicts.
- **Email:** Resend is the approved transactional email provider. It will support reservation/customer messages and production Supabase Auth email delivery using the appropriate server-side/API or SMTP integration.
- **Future mobile notifications:** client mobile notifications are part of the product roadmap, but the exact channel/provider (for example SMS and/or push) is intentionally undecided until a separate design/privacy/cost task is approved.

Neon and Clerk are legacy providers being replaced. Do not build new product dependencies on them.

## Delivery sequence

The active roadmap is tracked in GitHub Issues. Work remains bounded and ordered:

1. Complete and merge the reviewed Supabase database foundation.
2. Replace Clerk with Supabase Auth.
3. Wire the approved Lovable reservation flow to real Supabase-backed server APIs; remove localStorage as booking authority.
4. Wire the approved staff/admin experience to the same authoritative backend.
5. Add Resend transactional email and Supabase Auth delivery.
6. Run release, privacy, concurrency, responsive, accessibility and end-to-end verification.
7. Retire remaining Neon/Clerk dependencies only after the replacement is verified.
8. Design mobile client notifications as a later feature; do not block V1 completion on that future channel.

## Repository workflow

Use this repository for source code, issues and the active roadmap.

- Work on feature branches.
- Open pull requests targeting `main`.
- Never push directly to `main`.
- Never enable auto-merge.
- Only the Founder decides and performs merges.
- No Production/DNS/provider retirement changes without explicit Founder authorization.
- Keep credentials, customer data and auth exports out of the repository.

See `AGENTS.md` for the version-controlled engineering and agent rules.

## Local development

Use Node.js 24.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Never commit secrets.

Primary checks:

```bash
npm test
npm run typecheck
npm run build
```

## Current status

Supabase PostgreSQL foundation work is in PR #17. The Frankfurt application migration has been applied and verified, but PR #17 remains unmerged and the runtime cutover has not occurred.

The live public site remains the approved Lovable deployment on `nea1889.pizza`.
