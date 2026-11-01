# NEA 1889

Restaurant reservation app with a public booking form, personal reservation status and cancellation, and a staff management panel.

**Stack:** Next.js, React, TypeScript, Neon PostgreSQL and Clerk authentication. Hosted on the existing [Vercel project](https://vercel.com/neapizza1889/nea-1889-reservations).

## Work together

Use this repository for source code, [issues and the roadmap](https://github.com/Nejo12/nea1889pizza/issues/2). Make changes on a branch and open a pull request for review before merging into `main`.

## Local development

Use Node.js 24. Run `npm ci`, copy `.env.example` to `.env.local`, configure your development database and Clerk credentials privately, then run `npm run dev`. Never commit secrets.

Checks: `npm test`, `npm run typecheck`, `npm run build`.

## Current status

The application is available as a Vercel preview; the production migration is not complete. Keep the existing backend and authentication in place. [Supabase migration](https://github.com/Nejo12/nea1889pizza/issues/1) is deferred and is not implemented.

## Brand assets

Use only the founder-supplied artwork approved for issue #3 on 1 November 2026. Preserve the complete artwork and its aspect ratio; do not redraw, recolor or crop it.

- `public/nea-logo.png`: gold Authentic Neapolitan emblem, converted from the supplied `(2).jpeg` with identical decoded RGB pixels; public header, login and reservation status.
- `public/nea-logo-black.jpeg`: supplied monochrome emblem, unchanged; staff sidebar.
- `public/nea-72-ore.jpeg`: supplied 72 ORE by NEA 1889 artwork, unchanged; booking introduction.
- `public/icons/nea-{32,180,192,512}.png`: gold emblem proportionally resized onto white square canvases with padding; favicon, Apple touch icon and PWA icons.

The previous logo, background artwork and SVG favicon are replaced. No outside imagery is used.
