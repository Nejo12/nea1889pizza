# Frontend consolidation: approved Lovable UI → this Next.js application

Status: foundational port, **not deployed**. No Production, DNS, database, provider or Lovable change is part of this work. Refs #21.

## Decision (Founder, 2026-11-06)

`Nejo12/nea1889pizza` is the single canonical codebase. `Nejo12/nea-naples-table-booking` (TanStack Start, Lovable) is the **approved visual source** and a design/reference tool. Its frontend is ported into the existing Next.js app; the booking engine, migrations and tests in this repository are unchanged.

This supersedes the "generated copy inside the Lovable repo" mechanism in `docs/issue-21-lovable-integration.md`. `scripts/sync-lovable.mjs` and its test stay untouched until the Founder retires that path; nothing here depends on them.

## Hosting: current vs proposed

| | Today (Production) | Proposed future |
| --- | --- | --- |
| Public site `nea1889.pizza` | Lovable deployment (demo, browser-local reservations) | This Next.js app (`npm run build`), host to be chosen and approved |
| DNS | Managed in Vercel, routed to Lovable. **Unchanged.** | Cutover only on explicit Founder authorization |
| Database | none authoritative for the live site | Supabase `nea1889Pizza` (`amfaldeqkqqovfggayoj`), Frankfurt |
| Vercel projects | none (obsolete ones deleted; do not recreate) | A runtime requires explicit approval as the single canonical runtime |

Until cutover, the Lovable site remains Production. The Next.js site ships `robots: noindex` so a non-Production deployment can never compete in search results; remove it as part of the authorized cutover.

## What was ported

| Area | Lovable source | Here |
| --- | --- | --- |
| Pages | `src/routes/{index,menu,reservierung,impressum,datenschutz}.tsx` | `app/(site)/…/view.tsx` (client) + `page.tsx` (metadata) |
| Chrome | `src/components/site/*` | `components/site/*` |
| Calendar | shadcn `ui/calendar` | `components/site/calendar.tsx` (slim; no cva/Slot/Button) |
| i18n (6 languages), legal text, menu data | `src/lib/{i18n,i18n-dict,legal-i18n,menu-data,utils}` | `lib/site/*` |
| Styles / tokens | `src/styles.css` (Tailwind v4) | `app/(site)/site.css` |
| Images | `*.asset.json` pointers to Lovable CDN | downloaded from the public site, size-verified, in `public/brochure/` (only the files in use) |

Router conversion: `createFileRoute`/`head` → page `metadata`; `Link to=` → `next/link`; active nav state via `usePathname`. Route groups give each area its own root layout and CSS: `app/(site)` (Tailwind, public design) and `app/(legacy)` (existing `globals.css`, staff `/login`, `/admin`). URLs are unchanged.

## Deliberately not ported

- `src/lib/reservations.ts` (localStorage demo engine) and `src/routes/staff.tsx` (demo staff page).
- `src/server/booking/*` generated engine copy, `lovable-error-reporting`, `error-capture` (Lovable-specific).
- Radix `Checkbox` (native checkbox used), `tw-animate-css`, TanStack Router/Query/Start.

## Reservation flow

`/reservierung` keeps the approved five-step wizard but posts to the existing `POST /api/booking` (idempotency `requestId` + 256-bit token, honeypot, consent flag). The server revalidates everything; the UI's slot list is advisory. The confirmation step shows the personal status link (`/reservation#<token>`, existing page) instead of the demo reservation number. No reservation data touches browser storage (only the language preference does).

### Intentional differences from the live Lovable UI (need Founder confirmation)

1. **Opening hours** come from `lib/reservation-rules.ts` (owner-supplied: Sun–Fri 11:30–21:30, Sat 15:30–22:00, last arrival 21:00/21:30), not the Lovable placeholders (Pranzo/Cena, Monday closed). The home "Orari" card now shows these and the Monday row is gone.
2. The Pranzo/Cena shift toggle and all simulated capacity labels (available/few/full) are removed (Founder-approved). Selectable times show only their table window ("bis HH:MM") and make no claim about table availability; past times are disabled and labelled. Availability is decided by the server on submit.
3. Demo wording (`r.demo`, `c.noMail`, `c.number`, `f.submit`, …) updated in all six languages to describe the real flow. New keys: hours, status-link and copy-link strings.
4. "Staff Login" links to the existing `/login`.

## Verification (local, throwaway PostgreSQL only)

- `npm run typecheck`, `npm run build`, `npm test` (50 tests incl. `tests/site-port.test.cjs`).
- Full-page screenshots vs live `nea1889.pizza` at 1280 px and 390 px for `/`, `/menu`, `/reservierung`: identical document height on desktop for all three; mobile differs only by the text changes above.
- Browser run against the built app and a throwaway local PostgreSQL (migrations applied, `nea_runtime` role): consent validation, 5-step flow, `POST /api/booking` → 201, status page shows "Anfrage in Bearbeitung", no reservation keys in localStorage.

## Remaining work, in dependency order

1. ~~Guest status page (`/reservation`) in the new design, localized server errors~~ — done: `app/(site)/reservation`, structured `code` on `/api/booking` errors (`BOOKING_ERRORS` in `lib/reservation-rules.ts`, German `error` text kept for compatibility), six-language `rs.*`/`err.*` keys, `tests/guest-status.test.cjs`.
2. ~~Availability endpoint~~ — done (#13): `GET /api/availability?date=YYYY-MM-DD&guests=1..12` → `{date,guests,advisory:true,slots:[{time,status}]}` with status `available|full|past|closed`. Read-only and advisory: it uses the confirmation rules (`slotKeys` occupancy keys, seat-sum across free tables, `slotsForDate`, blocked days, Berlin clock), pending requests hold nothing, and no counts/tables/bookings are exposed. The wizard step 3 now uses it via `lib/site/availability-client.ts` (latest-request-wins with abort, loading/error/retry; on error the opening-hours list stays selectable and is labelled unchecked; full/closed/past/day-closed states; six-language `av.*` wording stating availability is advisory and the request stays pending until confirmed). Still open (separate follow-up): CORS/Origin check and rate limiting — no in-memory limiter was added.
3. **Supabase Auth** (#12) replacing Clerk; then port the staff/admin UI to the approved design (#14). `/login` and `/admin` remain legacy until then.
4. **Resend** transactional email (#19); the confirmation screen says no automatic email is sent until then.
5. **Legal/privacy review**: Impressum/Datenschutz still contain `[placeholders]` from the Lovable source, and the site loads Google Fonts from Google's servers (not disclosed in the privacy text; consider self-hosting).
6. **Accessibility/responsive audit** (keyboard flow of the calendar and wizard, contrast of muted text, screen-reader pass) and PWA/offline decision for the public site (the legacy layout still registers the service worker; the site layout does not).
7. **Hosting decision and non-Production preview**, secrets/`DATABASE_URL` provisioning, then cutover (Founder-authorized; DNS stays untouched until then). Retire Neon/Clerk and the Lovable sync path afterwards.
8. `npm run lint` does not exist in this repository (no ESLint config); add only if the Founder wants it.
