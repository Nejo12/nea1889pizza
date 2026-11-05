# NEA 1889 — Supabase migration baseline and design reconciliation

Audit date: 2026-11-05. Tracking: [#10](https://github.com/Nejo12/nea1889pizza/issues/10), parent [#1](https://github.com/Nejo12/nea1889pizza/issues/1).

Status: evidence collected and architecture proposed; resource-level data inventory and Founder decisions remain open. This document does not certify migration readiness or authorize live changes.

## 1. Authority and method

| Source | Exact revision / target | Meaning |
|---|---|---|
| GitHub main | `50e020624b5d60d999ed02c89f83f81d79513b8f` | Authoritative current implementation |
| PR #8 | `08abdac727ecd89e8089f1eebf1c5c89ff1b6807` | Draft reference handoff; only tsconfig correction in latest commit; exact-head build still unverified |
| PR #9 | `14e22b9a7561bef1615414b66f1abc25f7f25985` | Draft partial visual port; successful exact-head Next.js/TypeScript build, incomplete fidelity/functional acceptance |
| Lovable | `8e53de56ec688babd5a075ddb3ff03a4b5e48af7` | Founder-approved design source |
| Vercel team | `neapizza1889` / `team_M40nlQqRl0XQ2uXfR5Bx1ivZ` | Personal Nea1889 connection |
| Vercel project | `nea-1889-reservations` / `prj_uaiS2L4EUD6K7dVrkXFn3bsXXP7i` | Existing project; never replace/delete it |
| Intended Preview | `dpl_8kXZqwN53gnHZD7AMDpJjbVU1E4L` | PR #9 exact head |
| Protected Production record | `dpl_QHhtZ86gF4EPqpqrg3hdsdSeatMK` | Must not be deleted |

Read-only evidence: complete main/PR trees, relevant application files and tests, Lovable source/files/database-status connector, Vercel integration/store/environment metadata, Clerk dashboards, public Lovable pages, and the earlier same-session Preview verification. Values of database/auth secrets were not decrypted or copied.

Main contains no repository AGENTS.md, CLAUDE.md, docs directory or GitHub Actions workflows at this revision. README, source/tests and Founder instructions therefore define the baseline. Lovable's AGENTS.md applies to its separate source project and warns against history rewrites and hand-editing its managed database; this audit changes neither project runtime.

## 2. Resource and ownership inventory

| Item | Verified evidence | Remaining limitation |
|---|---|---|
| Neon resource | `neon-alizarin-bridge`; Vercel store `store_FIoZOSSRJUbfMjYM`; external project `dry-cherry-43460651` | Branch/endpoint/database IDs and actual table counts not yet inspected |
| Neon installation | `icfg_zRqGE8I8TsITztoUJq8PHJXy`; native Vercel Marketplace; owner team above | Do not uninstall whole integration without consumer inventory |
| Neon connectivity | Exactly one Vercel connected project in store metadata, connected to Preview AND Production | Does not exclude external consumers, extra branches, scripts or old deployments |
| Neon location/features | Metadata region `fra1`; `auth: true`; resource ready/available | Neon Auth is provisioned metadata; no evidence the current Next.js code uses it |
| Neon plan | Installed plan `free_v3`, labelled Free | No verified positive recurring saving; invoice/usage audit is not complete |
| Clerk resource | `clerk-bole-pillar`; Vercel resource `ir_yGkEqtgGWVWZMjTR`; application `app_3LLBLGQKMuspDrrXhlWaUXnk8AT` | Exact webhooks/OAuth settings/pending invitations not audited |
| Clerk installation | `icfg_sJpYYBJ1XWgRkeKbixHUsteG`; native Vercel Marketplace; one connected Vercel project, Preview AND Production | Do not infer resource disconnection from installation-level projects:[] |
| Clerk Production instance | `ins_3LLBLDcekJpDDWSMjpw3DiEnjva`; Users page: No users yet | Production setup incomplete; dashboard shows 0/2 setup tasks |
| Clerk Development instance | `ins_3LLBLCEFfRatoFACIsJEOj6Kll0`; Users page: No users yet | No user export/import currently justified by these empty instances; recheck before cutover |
| Clerk domain/plan | Resource domain nea1889.pizza; Hobby `hobby_2025_08`, listed $0/month | Vercel warns DNS setup needs attention; do not repair old-provider DNS during migration planning |
| Supabase destination | No NEA-named project in either connected account's project list | Destination organization/project/ref/plan not selected; naming absence is not proof none exists elsewhere |
| Lovable database | get_database_status: enabled=false | Do not enable another database automatically |
| Public website | nea1889.pizza serves Lovable; reservation page displays explicit browser-only demo warning | No central demo-booking inventory or proof that nobody entered real details |

The Neon dashboard SSO attempt reached an email-activation requirement. No activation links were resent, mailbox inspected, data queried or account settings changed. Provider-level branch/data inventory is blocked until the owner completes that activation/sign-in. The transient sign-in page can expire; return through Vercel's Open in Neon control after activation.

### Environment dependencies

| Key(s) | Vercel scope | Application role / action |
|---|---|---|
| DATABASE_URL | Preview + Production | Used by lib/database.ts and migration/import scripts; replace only after target verification |
| NEA_DATABASE_SCHEMA | Not present in current environment metadata | Preview code defaults to nea_migration_preview; Production code requires explicit schema and fails without it. Historical deployment snapshots were not decrypted, so their effective schema is not established |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY | Separate Preview and Production records | Used by auth-config and Clerk server/client integration; do not remove until Supabase replacement works |
| STAFF_EMAILS | Preview only | Verified primary-email allowlist; empty/missing denies access in current main |
| AUTHORIZED_ORIGINS | Not present in metadata | Code additionally admits VERCEL_URL origin in Preview; local development admits localhost:3000 |
| ADMIN_PASSWORD | Preview only | No reference in current main application code; legacy candidate, not permission to delete |
| NEON_AUTH_BASE_URL, VITE_NEON_AUTH_URL | Preview + Production | Integration-provided; no current-main application references found |
| PGHOST_UNPOOLED, POSTGRES_USER, POSTGRES_DATABASE, PGPASSWORD, POSTGRES_URL_NON_POOLING, POSTGRES_PASSWORD, NEON_PROJECT_ID, POSTGRES_PRISMA_URL, PGUSER, PGHOST, PGDATABASE, DATABASE_URL_UNPOOLED, POSTGRES_URL_NO_SSL, POSTGRES_HOST, POSTGRES_URL | Preview + Production | Neon integration-provided; current app directly uses DATABASE_URL, not these aliases. Check external consumers before removal |

Neon and Clerk advertise secret synchronization. Deleting environment variables alone is not sufficient retirement: review the scoped resource connection so the integration cannot reintroduce old credentials. Never print values or transfer them into issues or fixtures.

### Deployment and domain dependencies

Automatic Preview branch tracking was verified Disabled in Vercel's Environments page earlier in this audit session. Do not enable it for this documentation change or deploy the audit branch.

Alias evidence needs reconciliation: list_aliases maps nea-1889-reservations.vercel.app to Preview `dpl_H4MnzbsbtrRG56hCSPy1fAw8u87i`, while the Production deployment detail also lists that alias. Preserve both possible operational targets pending resolution in #15. The team-suffixed alias maps to the protected Production deployment in list_aliases.

DNS records for apex and www point to Lovable's 185.158.133.1; the custom domain is not attached to the Vercel reservations project. Entri Connect is a domain integration and is outside the Neon/Clerk retirement scope. No DNS/Lovable changes are authorized here.

## 3. Existing application: reuse and migration boundaries

| Path | Current responsibility | Migration treatment |
|---|---|---|
| lib/database.ts | postgres connection; transaction-local search_path; transactional batch with schema advisory lock | Retain adapter initially; use Supabase PostgreSQL endpoint and explicit schema; verify pooling/role behavior |
| database/schema.sql | blocked_days, legacy reservations, bookings, occupancy and indexes | Version application migrations; preserve data/keys; do not overwrite Supabase-managed schemas |
| lib/booking-store.ts | Token hashing/redacted guest DTO; table capacity validation; occupancy allocation/update transaction | Preserve atomic behavior; test concurrent confirm/edit/cancel on real PostgreSQL |
| lib/reservation-rules.ts | Berlin time, slots, table inventory, validation and status vocabulary | Remains baseline until D2/D3 below are decided |
| app/api/booking/route.ts | Public POST request, GET token status, PATCH cancellation | Retain contract/idempotency/high-entropy token hashes; no guest account required |
| app/api/reservations/route.ts | Authorized staff list/create/edit/status/table and blocked-day operations | Replace identity provider; keep explicit server authorization and SQL transactions |
| app/api/staff/session/route.ts | Clerk-backed staff access check | Replace with Supabase verified identity and current staff membership |
| lib/auth-config.ts, lib/clerk-staff.ts, lib/staff.ts | Clerk configuration, token validation, verified primary-email allowlist | Replace in #12; access must fail closed |
| app/login/login.tsx, app/login/auth-fetch.tsx | Clerk UI/session token and protected fetch context | Real Supabase login/recovery/logout; disable open staff signup rather than copy current SignUp UI |
| app/admin/manager.tsx | Existing day/search/status dashboard, guest details, telephone creation, edit, table assignment and blocked days | Reuse functionality; apply approved staff visuals; replace unbounded historical PII fetch with suitable query bounds |
| app/booking-form.tsx | Existing one-page real request form | Replace presentation with approved wizard; keep backend authority |
| app/reservation/page.tsx | Personal token status/cancel screen | Preserve existing links and privacy behavior |
| scripts/build.mjs, scripts/migrate.mjs | Preview build currently initializes schema | Move hosted migrations to explicit controlled steps in #11; never run ordinary build against Production DDL |
| scripts/import-sites.mjs | Imports/verifies four tables from a private export | Rehearsal required: it sets startup search_path rather than per-transaction search_path; do not assume safety on transaction pooling |
| tests/*.test.cjs | Booking/auth/rules tests and PGlite adapter/occupancy coverage | Preserve; supplement actual concurrent PostgreSQL/role tests rather than treat PGlite as hosted verification |
| public/sw.js | Caches generic offline page only; no guest/staff data cache | Preserve; test offline never claims an unsaved booking succeeded |

Git blob comparison confirms PR #9 leaves admin/manager, both reservation API route files, booking-store, database adapter and reservation-rules unchanged from main. Its visual implementation is not evidence of a Supabase migration.

Legacy reservations and bookings coexist in the schema; actual row counts and data significance are unknown. No table or confirmed booking is disposable without reconciliation.

Potential integrity concerns to test in #11/#13, not silently fix in a documentation task: confirmation reads booking before its write transaction; public pending-request quotas are read-before-write; status transitions are an enum, not a demonstrated complete transition policy. These are investigation targets, not a claim that an exploit or production failure was reproduced.

## 4. Proposed architecture decision

Founder-approved product direction: preserve approved Lovable UI; replace BOTH Neon and Clerk with Supabase. Implementation details below are proposed pending the inventory and decisions.

1. Keep Next.js as the single runtime and GitHub main as implementation authority.
2. Browser guest UI calls existing Next.js APIs; server validates, persists to Supabase PostgreSQL and returns pending status only after success.
3. Staff use Supabase Auth cookie/SSR sessions. Server verifies identity and active staff membership before each protected operation. A valid session alone does not grant restaurant access.
4. Keep existing postgres SQL/transactions initially. A Supabase database is PostgreSQL; there is no need to fragment table-allocation transactions into multiple REST calls.
5. Keep application PII/token hashes in an unexposed schema with explicit grants/RLS design. Runtime SQL does not automatically inherit an end user's Supabase JWT: server authorization and tested database role boundaries are essential. Separate runtime and migration credentials.
6. Use current Next.js 16 SSR session refresh guidance; protect mutation origins/CSRF, callbacks/redirects and personalized response caching. No secrets in NEXT_PUBLIC variables.
7. Do not keep Clerk via Supabase third-party auth as the final solution; that would retain the provider selected for replacement.
8. Keep guests account-free and preserve secure existing personal links. Do not copy Lovable's short random demo tokens or browser booking database.
9. Local Supabase for initial rehearsal; one deliberately managed remote Preview when an owned target and cost/environment plan are approved. Isolate from Production; no permanent paid duplicate database by default.
10. No speculative Edge Functions, Realtime, menu CMS, notification provider or second styling system. Add a bounded requirement only when needed.
11. Self-host licensed approved fonts/assets in the Next.js project if their transfer/license is verified; do not invent imagery. Lovable currently loads Google Fonts; deployment/privacy treatment must be deliberate.
12. Preserve the source providers through verification, data reconciliation and an agreed rollback period. Existing retained deployments must be accounted for before deletion.

Technical references:
- [Neon migration](https://supabase.com/kb/guides/migrate-from-neon)
- [PostgreSQL connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [SSR client and server authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Data API security](https://supabase.com/docs/guides/api/securing-your-api)
- [Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Clerk migration/export](https://clerk.com/docs/guides/development/migrating/overview)
- [CLI v3 targeting change](https://supabase.com/changelog/supabase-cli-v3)

## 5. Route, state and design parity matrix

| Surface | Approved Lovable source | Main / PR #9 gap | Required outcome / owner |
|---|---|---|---|
| Shared chrome | SiteChrome.tsx; marble, emblem, sticky header, burger/drawer, language selection, footer | main has reservation chrome; #9 has simplified header/footer, no language switcher or original marble assets | Faithful approved chrome; original assets; accessible drawer and focus; coordinate #9/#13 |
| Home / | routes/index.tsx; torn imagery, collage, editorial brochure sections and campaign artwork | #9 has rewritten sections and legacy image rather than exact artwork/layout | Port approved sections/assets; verify screenshots, no invented replacement; coordinate existing #9 |
| Menu /menu | routes/menu.tsx; menu-data.ts; category navigation/motion, dietary/allergen content | #9 /speisekarte is a small placeholder menu and different layout; /menu mapping undecided | Preserve approved design/menu structure; decide canonical route/compatibility mapping; operator verifies content |
| Reservation /reservierung | routes/reservierung.tsx; guests/date+shift/time/details/acknowledgement | #9 retains existing one-page form | Port wizard, errors, back navigation, language persistence and real server availability; #13 |
| Request success/status | Lovable local pending acknowledgement and ICS | main has secure /reservation token status/cancel; Lovable has no equivalent server-backed guest status route | Success only after persistence; pending is not confirmed; retain token status/cancellation and deliberate tentative calendar semantics; #13 |
| Staff login | routes/staff.tsx fake login | main Clerk login with signup button; #9 palette only | Real Supabase login/logout/recovery; explicit approved staff access; #12 |
| Staff dashboard | routes/staff.tsx date/shift/covers/status and blocked days | existing main manager is richer operationally but different visually; #9 changes colors only | Apply approved visuals without losing real table assignment/edit/no-show; #14 |
| Legal /impressum | German draft, placeholders, informational translations | #9 different incomplete draft | Keep design but use actual operator-approved content; not release-ready |
| Privacy /datenschutz | Draft and translations; includes unverified deployment/storage/legal statements | #9 also draft | Match actual new providers, retention, fonts and processing; do not copy prototype claims as facts |
| Languages | i18n.tsx, i18n-dict.ts, legal-i18n.ts; de/en/it/fr/es/pt | main and #9 German only | Preserve approved language behavior and German authoritative legal text; verify all states; coordinate #13/#14 |
| PWA / offline | Not equivalent to existing Next.js install flow | main has manifest/icons/install UI and offline fallback; #9 retains them | Preserve behavior; review visual placement against approved design; no offline booking storage |
| Mobile | Approved drawer, typography and responsive image choices | #9 reservation form extends into footer at 375px | Fix in its selected implementation scope, compare 375/768/1440 and keyboard/zoom; do not mask with a second UI system |

Measured earlier on PR #9 at 375px: booking form bottom ~2013px; footer top ~1956px, overlap ~58px. Source contains an 8% grid gap retained after switching the booking grid to one column; investigate percentage-gap overflow as the likely cause. No fix/redeployment is part of this audit.

### Visual foundations

| Foundation | Lovable source / observed requirement | PR #9 current |
|---|---|---|
| Type | Cinzel (400/600/800), Cormorant Garamond (500 normal; 400/600 italic), Archivo (400/600/700); root currently requests Google Fonts | Georgia/Arial approximations; approved fonts not bundled |
| Palette | blood red #A12B29, ochre #C58C42, gulf #0D437D, plaster #EDE4D8, soot #0E0C07; full semantic/OKLCH tokens in styles.css | Base colors approximated; incomplete semantic/parity implementation |
| Texture/artwork | Marble desktop/mobile; original emblem; torn imagery; stickers/posters/collage | Legacy logo/photo; invented gradients/poster text treatment |
| Motion | Drawer/burger, language fade, menu reveal/category indicator/hover; reduced-motion handling | No equivalent full behavior |

Language preference localStorage is acceptable for presentation. Reservation localStorage and fake authentication are not acceptable operational substitutes.

## 6. Approved asset inventory

Lovable file enumeration: 123 files across two pages. There are 26 asset-reference JSON files, three brochure binary images and one binary favicon. All are absent as equivalent paths in main, PR #8 and PR #9. Existing public/nea-logo.png and nea-napoli-background.jpeg are different baseline assets; no equivalence to the approved brochure binaries has been established.

The references identify actual public asset URLs; they are not themselves image bytes. Browser checks of nea1889.pizza confirmed emblem, hero, collage, three textures, alley and both campaign posters load. Some source filenames contain 640/1280 but decoded dimensions differ; validate natural dimensions rather than assume the filename is a width guarantee. Remaining items require transfer/byte validation. Lazy images not loaded in the first viewport were not classified as broken.

Proposed transfer: retrieve the approved original from the source URL or Lovable export, verify format/bytes/dimensions/checksum, commit it to the Next.js approved assets directory and rewrite imports. Do not rely permanently on Lovable internal /__l5e URLs or add an external image substitute. Metadata byte sizes below are reported by the source, not independently verified downloads.

| Reference below src/assets/brochure/ | Reported bytes | Source-relative URL |
|---|---:|---|
| `alley-strip.jpg.asset.json` | 174730 | `/__l5e/assets-v1/5e9f17c6-c728-468d-95ea-9ce87cce002a/alley-strip.jpg` |
| `hero-vesuvio.jpg.asset.json` | 300844 | `/__l5e/assets-v1/a7fd574e-feaf-450a-bb33-2bdf83ece748/hero-vesuvio.jpg` |
| `logo-72ore.jpg.asset.json` | 18366 | `/__l5e/assets-v1/87c82123-87a3-406d-9abc-038436d4f886/logo-72ore.jpg` |
| `logo-n1889.jpg.asset.json` | 41289 | `/__l5e/assets-v1/fb8a4a05-e570-43c5-b3de-edd2b1f1181f/logo-n1889.jpg` |
| `logo-nea.jpg.asset.json` | 18558 | `/__l5e/assets-v1/ad7453e4-29ea-4155-aa1e-eae3261f1b09/logo-nea.jpg` |
| `merch.jpg.asset.json` | 126976 | `/__l5e/assets-v1/84e64bf6-05fe-4961-bb21-ea032a293d71/merch.jpg` |
| `opt/alley-strip-640.webp.asset.json` | 96644 | `/__l5e/assets-v1/d44e75dd-900e-4e93-b61c-ba1a1b446064/alley-strip-640.webp` |
| `opt/hero-vesuvio-1280.webp.asset.json` | 119002 | `/__l5e/assets-v1/24b7f06a-27bc-4a20-a6dd-df9d70537924/hero-vesuvio-1280.webp` |
| `opt/hero-vesuvio-640.webp.asset.json` | 49318 | `/__l5e/assets-v1/7879ae42-6365-406c-9cc7-44646c0b81e9/hero-vesuvio-640.webp` |
| `opt/merch-1280.webp.asset.json` | 55086 | `/__l5e/assets-v1/b7bc5002-014e-42c6-abec-aab5bb366aa0/merch-1280.webp` |
| `opt/merch-640.webp.asset.json` | 22864 | `/__l5e/assets-v1/ec1a95bd-e474-4877-866e-5b0090b3c82a/merch-640.webp` |
| `opt/poster-gennaro-1280.webp.asset.json` | 96614 | `/__l5e/assets-v1/c8e36d7d-80ba-49b7-a2c4-81189bd9d115/poster-gennaro-1280.webp` |
| `opt/poster-gennaro-640.webp.asset.json` | 88264 | `/__l5e/assets-v1/3a9c4cc2-c5fe-47ed-8e47-3a42aa2e4702/poster-gennaro-640.webp` |
| `opt/poster-napoli-1280.webp.asset.json` | 86408 | `/__l5e/assets-v1/11a34102-c6e0-42e3-96f8-5051a0dc8150/poster-napoli-1280.webp` |
| `opt/poster-napoli-640.webp.asset.json` | 80490 | `/__l5e/assets-v1/326bcec7-7fa7-499c-ae69-969ba9c8c76e/poster-napoli-640.webp` |
| `opt/stickers-1280.webp.asset.json` | 110752 | `/__l5e/assets-v1/b695975e-fba3-41e6-9f3f-a4530d0ae4be/stickers-1280.webp` |
| `opt/stickers-640.webp.asset.json` | 51484 | `/__l5e/assets-v1/553685b0-0cc0-4461-9414-818c21ad9f91/stickers-640.webp` |
| `opt/vision-collage-1280.webp.asset.json` | 247812 | `/__l5e/assets-v1/11281ee1-b415-4356-831a-511f4ee680d8/vision-collage-1280.webp` |
| `opt/vision-collage-640.webp.asset.json` | 104184 | `/__l5e/assets-v1/a71295cc-15d2-4b86-96c1-ffdeb4934bf1/vision-collage-640.webp` |
| `poster-gennaro.jpg.asset.json` | 180285 | `/__l5e/assets-v1/2bd79b6f-eaf1-4d0e-86b6-a3ef8fd991b9/poster-gennaro.jpg` |
| `poster-napoli.jpg.asset.json` | 163639 | `/__l5e/assets-v1/c67c770a-4d50-49a0-854e-a8021230b949/poster-napoli.jpg` |
| `stickers.jpg.asset.json` | 194940 | `/__l5e/assets-v1/5cf28ad0-3ec9-4059-889b-42380446d64e/stickers.jpg` |
| `tex-npattern.jpg.asset.json` | 17339 | `/__l5e/assets-v1/03c80585-7c4b-4ec5-b658-0acd2a4f9fae/tex-npattern.jpg` |
| `tex-plaster.jpg.asset.json` | 15521 | `/__l5e/assets-v1/03db0d29-66f2-410f-9b1b-b10f4c14cf64/tex-plaster.jpg` |
| `tex-tiles.jpg.asset.json` | 30338 | `/__l5e/assets-v1/7d910162-64b9-43a3-a9d2-c5190ff64627/tex-tiles.jpg` |
| `vision-collage.jpg.asset.json` | 413781 | `/__l5e/assets-v1/5df4d9d9-a73e-462c-bbf5-fdd929cd35a1/vision-collage.jpg` |

| Binary source | Role | Transfer state |
|---|---|---|
| src/assets/brochure/emblem-160.webp | Header/footer emblem; decoded 160x160 on public site | Source enumerated; not transferred |
| src/assets/brochure/marble-1920.webp | Desktop background | Source enumerated; not transferred |
| src/assets/brochure/marble-mobile.webp | Mobile background | Source enumerated; not transferred |
| public/favicon.png | Lovable favicon | Source enumerated; compare with approved Next.js favicon/PWA branding before changing |

PR #8 captures 16 reference source/style files plus its README, but omits these assets and the root font-loading file. Keep tsconfig reference exclusion intact if the handoff is eventually merged. Never install the entire Lovable TanStack/Tailwind/dependency stack just to compile an isolated reference.

## 7. Business-rule decision register

No new restaurant rule is approved by this document. Main remains the implementation baseline until an explicit decision supersedes it.

| ID | main | Lovable reference | Proposed decision / required input |
|---|---|---|---|
| D1 Target ownership | Neon/Clerk Vercel-owned resources | No enabled cloud database | Confirm dedicated NEA-owned Supabase organization/account and project, EU location and environment/cost plan; no other product's project |
| D2 Schedule | So–Fr 11:30–21:30; Saturday 15:30–22:00; final arrivals 21:00/21:30 independent of closing | Monday closed; Pranzo 12:00–15:00, Cena 17:30–22:30; 75 minutes must finish before close | Founder supplies actual open/closed days, shifts, final arrival and whether seating may finish after kitchen closing |
| D3 Capacity | 13 indoor tables = 30 seats; 7 terrace tables = 24 seats; 54 listed total | 40-seat pooled demo | Confirm usable tables, terrace season/weather and valid table combinations; preserve table allocation, do not adopt demo total |
| D4 Pending requests | Do not occupy tables until confirmed/arrived | Demo counts every non-cancelled request toward capacity | Recommend keep pending as a request, with advisory availability and atomic confirmed allocation; approve whether pending should consume any capacity |
| D5 Status | pending/confirmed/arrived/cancelled/noshow | pending/confirmed/seated/cancelled | Recommend map seated presentation to arrived; retain noshow; explicitly define transitions/cancellation after arrival |
| D6 Staff onboarding | Both inspected Clerk instances have no users; main has email allowlist | Fake unrestricted login | Recommend explicit staff invitations, no open signup; verify invitation inventory/approved staff list before sending anything |
| D7 Customer messages | No automatic customer email; status link is authoritative | Demo no-mail message | Do not claim email delivery; choose a separate notification task only if required. Auth recovery/invite SMTP is a separate necessity for that flow |
| D8 Menu/content | #9 sample menu, no real prices | menu-data.ts has concrete prices/allergen codes, but prototype labels indicate confirmation needed | Obtain operator's authoritative menu/date and allergen legend; do not infer factual approval from visual approval |
| D9 Legal/retention | #9 drafts; incomplete operator/contact details | Draft legal pages and placeholders | Operator supplies factual details, retention and review; do not publish draft legal text as complete |
| D10 Existing Production | Protected deployment/aliases must remain | Public site remains on Lovable | Decide future consumer/cutover/rollback obligations before source-provider deletion; preserving record alone is not service continuity |

Preserved agreed baseline unless specifically changed: 1–12 online guests, 30-minute slot interval, 75-minute duration, Berlin timezone, manual staff confirmation, secure token guest access. No automatic payment/customer account/hold is introduced.

## 8. Public demo safety and data reconciliation

The public /reservierung page was inspected without submitting data. It visibly states that bookings are saved only in the browser and not sent to the restaurant; a prototype banner is also present. This is not a working shared booking channel, but the explicit notice reduces ambiguity. Do not remove it until real persistence is deployed.

Source keys: nea1889.demo.reservations and nea1889.demo.blocked. No central backend contains those browser-local submissions. Do not claim they can all be exported from Lovable or recovered by creating Supabase. If anyone used the demo for a real request, the restaurant must reconcile it through the relevant browser/contact before cutover. This audit did not inspect unrelated browser storage or real guest records.

Clerk Users screens show no users in both exact instances listed above; no password migration is currently required for those inspected records. Recheck users/invitations and application ownership before retirement. No invitations were issued and no verification email was resent. The Neon SSO flow itself displayed an activation-email notice.

## 9. Execution handoff, verification and exit gates

| Step | Issue | Allowed next bounded output | Gate |
|---|---|---|---|
| Baseline | #10 | This audit PR and completed missing metadata/decisions | Neon activation, data/branch inventory, D1–D10 resolved or explicitly deferred |
| Data | #11 | Local migrations/private schema/adapter and rehearsal | Owned target; counts/reconciliation; tests for transactions/access; no automatic hosted DDL |
| Auth | #12 | Real staff login/authorization and tests | Membership model; hosted SMTP/onboarding plan; no Clerk dependency in new runtime |
| Guest | #13 | Faithful wizard and real availability/status APIs | Approved rules; no localStorage booking authority |
| Staff | #14 | Faithful admin visuals plus preserved real operations | Auth/data gates and two-session operation/conflict tests |
| Release/retirement | #15 | Exact-head verification and concrete cutover/deletion manifests | Founder-controlled release, observation/rollback period, all required old consumers addressed |

One issue at a time, one branch/PR per bounded task; Founder alone merges. #6/#7 remain deferred. #8/#9 remain unmerged reference/integration PRs; neither is automatically merged/rebased/cherry-picked by this baseline.

No build/tests are required for this documentation-only change. Validate source references, table/asset counts, changed-file scope and exact PR base/head; report actual CI rather than claiming a runtime build passed for the audit branch. Existing main has no GitHub Actions workflow and automatic Vercel Previews remain disabled.

## 10. Outstanding blockers / next owner

- Founder: activate/sign in to Neon so a read-only branch/schema/table-count and external-consumer inventory can be completed. Do not paste activation links or credentials into GitHub.
- Founder: resolve D1 destination ownership and D2/D3 actual schedule/capacity first. No Supabase project is created by this audit.
- Engineer after access: record exact Neon branch/endpoint/database/schema IDs, counts by status, source significance, current billing/usage and scoped backup/restore plan. No PII in public evidence.
- Engineer/Founder: resolve the Production alias discrepancy and retained-deployment dependencies before any deletion.
- Operator: provide menu/legal facts and final rules before public release.
- Engineer: transfer verified approved assets and implement measured parity gaps only in the selected implementation task; all asset transfer/checksum states here remain pending.

Issue #10 must remain open while these blockers exist. This PR is a reviewable baseline, not a completed migration or full design acceptance.
