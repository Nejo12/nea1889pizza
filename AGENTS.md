# NEA 1889 — Engineering & Agent Rules

Repository: `Nejo12/nea1889pizza`

## 1. Source of truth

- GitHub `main` is the authoritative implementation state.
- The canonical public product is `https://nea1889.pizza`.
- The approved visual source is the Founder-owned Lovable implementation serving that domain.
- Historical Vercel test deployments, branches and closed PRs are references only unless explicitly re-authorized.

## 2. Canonical infrastructure

- Public site: Lovable on `nea1889.pizza`.
- DNS: managed in Vercel; current Lovable routing must be preserved until an explicit cutover.
- Database target: Supabase project `nea1889Pizza`, ref `amfaldeqkqqovfggayoj`, Frankfurt `eu-central-1`.
- Staff auth target: Supabase Auth.
- Transactional email target: Resend.
- Legacy providers being retired: Neon and Clerk.
- Future mobile client notifications are planned, but channel/provider selection is intentionally deferred.

Do not recreate or use the deleted Vercel test projects:
- `nea-1889-reservations`
- `nea-pizza-1889-preview`

Do not use `saint-gennaro-081` as the NEA application runtime; it is an old editorial preview.

## 3. Reservation authority

- Browser `localStorage` must never be the authoritative reservation store.
- Supabase PostgreSQL is the final authority for booking state.
- Availability checks in the UI are advisory; submission/confirmation must revalidate server-side.
- Preserve transactional occupancy protection and database conflict handling.
- Never silently discard or overwrite confirmed reservation data.

## 4. Email and notifications

### Resend — approved current scope

Use Resend for production transactional email. Keep email sending server-side.

Expected use cases include:
- reservation request acknowledgement;
- reservation confirmation/change/cancellation as business rules require;
- staff-facing operational messages where selected;
- Supabase Auth invitation/recovery delivery through reviewed custom SMTP/integration.

Do not expose Resend credentials to the browser. Domain authentication, sender addresses, templates, rate limits, privacy content and production activation require explicit review.

### Mobile notifications — future scope

Customer mobile notifications are a planned future feature.

Do not assume SMS versus push, provider, consent model, retention, cost or fallback behavior. Those decisions belong in the dedicated future issue before implementation.

## 5. Founder control

The Founder retains final control.

NEVER:
- merge a pull request;
- enable auto-merge;
- push directly to `main`;
- modify Production routing/DNS without explicit Founder authorization;
- delete provider resources without an approved retirement manifest;
- treat a previous approval as authorization for a new task.

Stop before merge with:

**READY FOR FOUNDER MERGE**

or

**DO NOT MERGE — blocker: ...**

## 6. Scope discipline

- One issue or clearly bounded objective at a time.
- Prefer extending existing architecture over creating parallel systems.
- No unrelated refactors.
- No speculative dependencies or frameworks.
- Record unrelated defects; fix them only when they block the current task or are explicitly authorized.

## 7. Verification

Relevant changes should verify:
- requested behavior;
- TypeScript;
- tests;
- build;
- database/schema behavior;
- auth/authorization;
- concurrency;
- responsive UI;
- accessibility;
- changed-file scope;
- migration safety;
- email/privacy behavior when applicable.

Passing CI alone is not proof of correctness.

## 8. Delivery order

Current completion path:

1. Supabase PostgreSQL foundation.
2. Supabase Auth replacement for Clerk.
3. Real Supabase-backed reservation flow on the approved Lovable UI.
4. Real authenticated staff/admin management.
5. Resend transactional email.
6. End-to-end/release verification and controlled retirement of legacy providers.
7. Future mobile notification design/implementation after V1 completion unless the Founder explicitly reprioritizes it.

## 9. Reporting

Use concise operational reports:

**STATUS**
- verified/completed work

**BLOCKERS**
- genuine blockers only

**NEXT**
- next action and owner

When Founder input is required:

🟢 **YOUR ACTION**
