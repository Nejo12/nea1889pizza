# NEA 1889

NEA 1889 is the restaurant website and reservation platform for **https://nea1889.pizza**.

## Canonical product and hosting rule

The canonical public product is **https://nea1889.pizza**. Its approved visual source is the Founder-owned Lovable version currently serving the live domain. The future deployed application is the consolidated Next.js code in this repository; it is not deployed yet.

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

- **Frontend / public experience:** the approved Lovable UI, already ported into this repository's Next.js app. The live Lovable deployment remains the public site until a separately authorized cutover.
- **Database:** Supabase PostgreSQL. Reservation state must be server-authoritative; browser `localStorage` must not be the booking database.
- **Staff authentication:** Supabase Auth, replacing Clerk.
- **Reservation integrity:** PostgreSQL transactions/constraints remain the final authority for availability, confirmation and occupancy conflicts.
- **Email:** Resend is the approved transactional email provider. It will support reservation/customer messages and production Supabase Auth email delivery using the appropriate server-side/API or SMTP integration.
- **Future mobile notifications:** client mobile notifications are part of the product roadmap, but the exact channel/provider (for example SMS and/or push) is intentionally undecided until a separate design/privacy/cost task is approved.

Neon and Clerk are legacy providers being replaced. Do not build new product dependencies on them.

## Delivery sequence

GitHub [Issues](https://github.com/Nejo12/nea1889pizza/issues/1) is the active roadmap. Completed work must not be confused with Production deployment.

1. **Merged:** Supabase PostgreSQL foundation (#11, PR #17); approved Lovable frontend port (#21, PR #26); guest status/localization (PR #27); advisory availability endpoint (#13, PR #28); wizard wired to advisory availability (#13, PR #31); CI on pull requests (#5, PR #30).
2. **Next (#13):** Origin/CSRF validation and bounded JSON parsing for `POST`/`PATCH /api/booking` are implemented (this PR, A1). Still pending (A2): durable abuse/rate controls. Browser storage must not become booking authority.
3. **Next (#12):** Replace Clerk with Supabase Auth for approved restaurant staff; then implement the real authenticated admin UI (#14).
4. **Next (#19):** Implement Resend transactional reservation email and reviewed Supabase Auth delivery.
5. **Release gates (#5, #10, #15):** Establish CI/branch controls, complete operator/legal/menu/privacy/accessibility verification and secure end-to-end tests, and approve one Node.js hosting/preview path.
6. **Founder-authorized cutover (#15):** Switch the existing `nea1889.pizza` domain only after the replacement is independently verified. Retire the disposable Supabase Preview and former Neon/Clerk dependencies only after approved dependency, backup and rollback checks.
7. **Later (#20):** Design mobile notifications separately; they do not block V1.

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

## Current status — 2026-11-06

- Latest verified `main` before this change: `d94f3a643828583bb48a2ebfb38c5095f18c3445` (merge of PR #31).
- PRs #17, #23–#28 and #30–#31 are merged. The approved public UI and guest status experience are consolidated in Next.js and the wizard uses the advisory `GET /api/availability`.
- The dedicated Frankfurt Supabase target is `amfaldeqkqqovfggayoj`; migration `20261105160000_nea_reservation_schema` is recorded. A temporary Preview branch `lyichglmkpeyyajkyucz` exists; its rotated runtime credential still needs successful fresh-connection verification.
- **Production remains the Lovable-hosted site** at `nea1889.pizza`, using demo browser-local reservations. No canonical Next.js Production or Preview deployment has been authorized or verified.
- Vercel manages the domain/DNS. Current apex and www records intentionally point to Lovable, not a Vercel Next.js deployment. Do not change routing without Founder authorization.
- Clerk code/dependencies remain until #12; Resend delivery awaits #19. CI (`Test, typecheck, build (Node 24 / PostgreSQL 17)`) runs on pull requests and a `main` protection ruleset exists; remaining release gates stay under #5. Guest `POST`/`PATCH` require a trusted `Origin` (see below); durable rate limiting is not implemented yet (PR A2).
- Prior Lovable Cloudflare/Hyperdrive engine-vendoring work (#23–#25) is historical. The approved future runtime is the unified Next.js application on a separately authorized Node.js host.
- See [frontend migration status](docs/frontend-migration.md) and [GitHub roadmap](https://github.com/Nejo12/nea1889pizza/issues/1).
