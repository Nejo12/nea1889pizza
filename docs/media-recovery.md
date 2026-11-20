# Media recovery — 2026-11-20

## Cause and source of truth

Vercel `nea1889-app` remains linked to `Nejo12/nea1889pizza`, production branch `main`. The reported media failures were not evidence of a repository takeover. Lovable's recovery report confirms a sampled asset URL on `nea-naples-table-booking.lovable.app` returns 302 to the same `/__l5e/assets-v1/...` path on `nea1889.pizza`, where the Next.js app did not have the file. Production request logs independently showed those 404s. No specific Lovable commit, person or publication is established as the redirect's cause.

The initial design port retained the Lovable publishing hostname as an external media origin. That assumption was unsafe after the host began redirecting. Original object IDs identify media; they do not guarantee that a publishing hostname remains a usable asset origin.

## Complete binary recovery

The owner supplied three independently extractable ZIPs containing original optimized objects, a manifest and two raw chunks for `story/ore-wide.mp4`. The maintainer extracted them without executing the supplied helper scripts, verified each chunk hash/offset/order, concatenated chunk 001 then 002, and independently validated every resulting object:

- **34 of 34 original media files**, 11,059,362 bytes total;
- **30 WebP images** fully decoded with Pillow and checked against declared dimensions;
- **4 MP4 videos** fully decoded with FFmpeg `-v error -xerror`;
- SHA-256 and byte size checked against the recovery manifest;
- original asset IDs and sizes checked against the pre-existing source inventory;
- no HTML/error responses, replacement artwork, regenerated media or recompression.

`docs/lovable-media-manifest.json` retains the original export URL/ID and records the local URL, SHA-256, MIME type and dimensions for each recovered object. All new binaries live under `public/home/` and `public/story/`. ZIPs, chunks, supplied helper scripts, credentials and manifests with personal data are not served.

The earlier supplied `homepage_title_top.png` was actually JPEG, and `scroll_second.jpeg` was a composed section screenshot. Neither was substituted for the originals; this avoids wrong transparency, cropping and duplicated text/logo overlays.

## Runtime changes

- Homepage title/poster/video and all story photos/logos/videos use same-origin `/home/...` or `/story/...` URLs. Existing brochure media remains local.
- Booking/menu/status backgrounds use the recovered original responsive WebPs, superseding PR #48's temporary JPEG fallback. The separately supplied JPEG remains the reservation-email header asset, unchanged.
- Exact inventory-derived legacy `/__l5e/assets-v1/<id>/<file>` paths return a temporary redirect to their known static files. This repairs cached pages and the old publisher's forwarded asset requests without a broad proxy, arbitrary destinations or redirect loops. Unlisted paths remain unhandled.
- Media identity and appearance are preserved. Layout, responsive source selection, translations, reservation rules, staff authentication, database, email behavior, DNS and deployment protection are unchanged. No tracking endpoint is introduced.

## Verification and release

Regression tests check all recovered hashes/types/sizes, every rendered media URL's file existence, the absence of external Lovable URLs in runtime presentation, both original background variants, and exact one-hop compatibility redirects. Check desktop/mobile on the exact READY preview, including title transparency, story overlays, imagery and video/poster behavior. Browser image verification does not establish playback on every device.

Only the Founder merges the PR. After merge, verify the exact Production revision and selected static/legacy media responses. No provider retirement is included: these files remove the known frontend media dependence, but deletion of Lovable or any other resource requires a separate dependency audit and explicit approval. No database writes, email sends or DNS/configuration changes are needed.

## Unrelated staff conflicts

The staff API intentionally returns 409 for stale revisions, occupied tables and invalid allocations. The dashboard reloads after 409; tests cover stale writes and atomic occupancy. Recent statuses alone do not identify the cause of individual conflicts. Do not remove these guards or retry mutations blindly; investigate the visible error and exact operation separately.
