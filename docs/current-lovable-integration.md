# Current Lovable design + authoritative reservations

## Scope — 2026-11-20

The Founder supplied `nea-naples-table-booking.zip` and confirmed that its current Lovable design, not the old Vercel homepage, is the visual source of truth. This change ports that presentation into the existing canonical Next.js app; it does not replace the approved backend, change providers, deploy to Production, or change DNS.

- `/`: supplied video hero, responsive title artwork, language switcher, reservation/menu/about CTAs, and five editorial story chapters.
- `/about`: the supplied About page, not an obsolete homepage. Its opening hours use the same provisional rules as the API, rather than reintroducing the demo's Monday closure/shift rules.
- `/menu`: latest export's menu presentation and data match the existing canonical implementation; the export's reservation/menu background is restored.
- `/reservierung`: retains the canonical five-step server-backed wizard, rendered with the current export's shared styling and background. No browser-local booking store, fake availability, or demo staff page is imported.
- `/reservation`: personal status/cancellation page shares the current booking background.
- Staff Login continues to `/login`, never the exported `/staff` demo.

The public request flow remains `GET /api/availability` → `POST /api/booking` → personal `/reservation#<token>` → token-authenticated status/cancellation. PostgreSQL remains authoritative. Idempotency, consent, origin checks, server-side validation, occupancy transactions and email behavior are unchanged. A request remains pending until staff confirms it; the interface must never claim a confirmed table merely because submission succeeds.

## Media provenance and remaining hosting dependency

The ZIP contains most new photos/videos as `.asset.json` pointers, not their bytes. Exact exported IDs are retained on `https://nea-naples-table-booking.lovable.app/__l5e/assets-v1/...`, the original publishing host from the export. They deliberately do not reference `nea1889.pizza`, so switching the custom domain cannot create self-referencing/missing asset paths. `lovable-media-manifest.json` records the export URLs and sizes; existing local brochure assets of matching sizes are reused unchanged.

**Do not retire the Lovable publishing project yet.** New media still depends on that host. Before independent hosting/retirement, obtain the actual media export, verify its bytes and replace the remote references with same-origin files. No booking tokens or guest details are included in asset URLs; the app retains its `no-referrer` policy.

## Verification and release gates

Local checks include the existing booking/availability/status tests, PostgreSQL-in-WASM adapter tests, TypeScript and production build, plus actual server-render tests of the current home and booking components. These checks are not proof of deployed Supabase connectivity or email delivery.

At investigation time:

- The existing pinned Next.js 16.4.3 dependency has moderate-severity advisories; the package audit recommends 16.4.6. A separate security upgrade/retest is required before release. This visual integration does not change dependencies.
- Production DNS apex/www still serves Lovable. No routing change is included.
- Preview has no `DATABASE_URL`. Do not use Production credentials or create test customer bookings in Production to work around this.
- Production `AUTHORIZED_ORIGINS` does not include the custom apex/www origins.
- Production `RESEND_API_KEY` and `EMAIL_FROM` are absent. Missing email configuration does not stop database persistence; it disables email.

Before release, configure an isolated Preview database via a separately approved configuration task, verify media and guest interaction on the exact PR preview, then test submission → persistence → staff confirmation → personal status/cancellation and approved-recipient email. Staff-auth verification requires an accessible approved test identity. Configure production origins/email, backups, rollback and actual DB access only through a separately approved production setup/cutover plan. Do not merge automatically or change production DNS as part of this source integration.
