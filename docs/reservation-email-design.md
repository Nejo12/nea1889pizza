# Reservation email design review

## Scope

Reservation acknowledgement, confirmation and cancellation emails share the supplied red NEA pattern, a compact wordmark header, status-specific badges, left-aligned content, a readable details table and a short footer. The original German subjects, plain-text alternative, Berlin date/time semantics, pending-only personal link, escaping, event claims/idempotency and Resend transport are unchanged. This is not a Supabase staff OTP-template change.

The supplied `rm_background.jpeg` is preserved byte-for-byte as `public/email/rm-background-0e7d40b0.jpg`. Sent HTML uses the fixed public HTTPS URL `https://nea1889.pizza/email/rm-background-0e7d40b0.jpg`. No guest details, booking tokens or tracking parameters are included in this URL. **Publish this asset together with the template**; it will not exist on Production until the change is deployed.

## Email-client fallbacks

- Essential content is live HTML, not an image. All colours, table structure and primary spacing are inline; a mobile media query reduces padding and title sizes where supported.
- The pattern uses a table-cell `background` attribute plus CSS background-image, with a solid dark-red `bgcolor`/background-color fallback. Classic desktop Outlook and clients blocking remote images may show the solid colour instead of the decorative pattern. The message remains readable; exact background parity is not promised.
- The overall card is fluid up to 600 px with a fixed-width Microsoft Outlook conditional wrapper. Typography falls back to installed Georgia/Times/Arial/system fonts; no remote fonts or scripts.
- Pending keeps both a status button and copyable link with its privacy warning. Confirmation and cancellation do not invent a personal link or claim one was sent. Names, subjects and link attributes remain HTML-escaped.
- The design does not change whether email is enabled or whether a provider accepted/delivered a message. Browser verification is not an inbox/deliverability test.

## Safe visual fixture

`/email-preview?kind=confirmed` (also `pending` or `cancelled`) renders the exact HTML using a fixed synthetic fixture on Vercel **Preview** or local development only. Every Production request is 404. It cannot look up bookings or send email, has no-store/noindex headers and a restrictive CSP, and replaces only the fixed asset host with the same-deployment path so the new image can be reviewed before launch. Do not add real guest data, keys or booking tokens to this fixture.

Verify desktop and narrow-mobile rendering on the PR's exact READY deployment. After Founder review/merge and an explicitly approved delivery test, send the three kinds only to an approved recipient and inspect the target inbox, including Yahoo/Outlook and blocked-image mode. No real emails or production changes are needed for the visual fixture.
