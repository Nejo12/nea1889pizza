# Media-source discrepancy — 2026-11-20

## Confirmed state

- Vercel `nea1889-app` is linked to `Nejo12/nea1889pizza`, production branch `main`. The live apex resolves to its READY deployment for `562472f` (merge of PR #47). There is no observed Vercel Git-link or custom-domain takeover by the private Lovable repository.
- `www.nea1889.pizza` is configured as a permanent redirect to `nea1889.pizza`; Previews remain protected. Preserve the database, mail settings and DNS.
- The current frontend's new home/story media still uses absolute URLs on `nea-naples-table-booking.lovable.app`. A public hostname diagnostic now reaches the Vercel-rendered home through that hostname. Production request logs show exact exported `/__l5e/assets-v1/...` image paths failing with 404 on the canonical domain.
- This is consistent with a publishing-host canonical redirect/proxy change. It does not prove a specific Lovable commit or who published it. The private Lovable source is inaccessible in this session, so no comparison with its current commits was possible.
- Earlier documentation assumed the Lovable publishing host would continue serving media independently after cutover. That assumption is no longer safe. Export asset UUIDs are identifiers, not a guarantee of byte availability on the publishing hostname.

## Bounded recovery in this PR

Use the supplied `rm_background.jpeg` bytes already committed by the email-design PR at `/email/rm-background-0e7d40b0.jpg` as both desktop/mobile reservation/menu/status backgrounds. It matches the user's approved red pattern and no longer depends on the Lovable hostname. Regression tests pin the local URL and original SHA-256.

This intentionally does **not** redirect missing images back to the publishing hostname: that could create loops. It does not substitute the obsolete design, disable booking safeguards, clear guest storage or change DNS.

## Required to finish full media migration

Obtain the actual current title/logo/photo/video files from the owner, not only `.asset.json` pointer files. The earlier ZIP includes mostly media pointers. `docs/lovable-media-manifest.json` inventories the exact exported names, IDs and expected sizes. Files must be reviewed against the current approved design, committed under public static paths with verified hashes/types, and all frontend references switched to those paths. If the design changed again, obtain a fresh source export plus its media binaries without `.env` files or secrets. Do not make a private repo public merely for this task.

Prioritize title/title-sm artwork, pizza-loop poster/video, counter photo, stacked/round logos and emblem tile, then the remaining story assets. Retain Lovable resources until complete; do not delete a provider or overwrite the public site's design to make 404s disappear.

## Staff conflicts

The staff update endpoint intentionally returns 409 for stale revisions, occupied tables or invalid allocations. The dashboard reloads after 409. Existing unit/PostgreSQL tests cover stale edits and atomic occupancy rollback. Recent response statuses alone do not identify which cause occurred, so the two observed 409s are not evidence of a broken concurrency guard. Never remove these checks or retry writes blindly; collect the visible error and operation first.

## Release

This is a partial media recovery, not a declaration that every media failure is fixed. Review the exact preview on desktop/mobile, preserve current booking behavior, and use the Founder's merge/release process. No booking writes, email sends, production mutations or private Lovable repository changes are part of this code patch.
