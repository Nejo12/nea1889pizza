# NEA 1889 — approved Lovable design reference (not executable)

This directory is a **read-only design implementation reference** captured from the Founder-approved Lovable prototype on 2026-11-05.

- Lovable project: https://lovable.dev/projects/ab59382d-5213-4a89-a21e-00de41f6afca
- Lovable commit SHA (latest checked): `8e53de56ec688babd5a075ddb3ff03a4b5e48af7`
- Proposed live domain (Founder-reported connected to Lovable): https://nea1889.pizza/
- GitHub `main` when reference was captured: `50e020624b5d60d999ed02c89f83f81d79513b8f`
- Source framework: TanStack Start, Vite, Tailwind 4.
- Production repository framework: Next.js 16, React 19, existing CSS.
- The source files here are for **review, handoff, and visual porting**; they are not imported into the production Next.js application.
- The original Lovable project owns asset binaries and `.asset.json` mapping. The referenced brochure images were not downloaded into this PR. The original approved brochure and logo files must be brought into the Next.js project under approved licensing/provenance; do not use replacement third-party assets.

## Critical booking security and integrity warning

The Lovable reservation demo stores reservation and blocked-day records in browser **localStorage** (see `src/lib/reservations.ts`). It does NOT talk to the shared restaurant database, and its demo staff page is not a secure production admin backend. The current Lovable prototype must not be represented to guests as working restaurant booking until the backend is integrated and independently tested.

**Founder action required:** If the public domain currently directs real customers to the Lovable prototype, disable or clearly block real reservation submission until the legitimate server-backed booking process is restored. Investigate whether anyone already attempted bookings in the demo; browser-local data cannot be treated as a central booking record.

## Implementation order

1. Verify deployed domain routing, existing production data ownership, and safety of booking calls.
2. Audit existing open PR #6 (approved branding) and PR #7 (booking improvements), compare against current `main`; resolve conflicts without duplicating work.
3. Port the approved Lovable visual system to Next.js, preserving production server routes and staff authorization. Do not copy the Lovable localStorage booking implementation into production.
4. In a separate scoped workstream, migrate Neon data/booking integrity to an isolated Supabase project, with data reconciliation, rollback and transactional table-conflict tests. Founder must approve any paid provisioning and Production cutover separately.
5. Add Resend transactional-outbox events when the staff-confirmation transaction commits. Keys stay server-side; implement idempotency, retries and delivery-state monitoring. Do not send email merely on guest inquiry.
6. Replace demo menu entries and invented prices/allergen indicators with restaurant-approved data. Verify `/impressum` and `/datenschutz` with actual operator and processing disclosures.
7. End-to-end and mobile/accessibility verification in Vercel Preview. Founder manually reviews PR and separately authorizes the Production cutover.

**Review state:** DESIGN SOURCE CAPTURE ONLY. Not release-ready. Never merge as if this enables the redesign, Supabase, or email confirmations.
