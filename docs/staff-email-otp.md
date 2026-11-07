# NEA 1889 staff login — six-digit email OTP

Scope: Issue #12, invite-only restaurant Admin/Staff login. The existing Supabase Auth identities and active `nea.staff_members` records remain the only authorization source. Guest bookings do not require login. Do not change Production during Preview validation.

## Application behavior

- `/login` and `/admin` use `supabase.auth.signInWithOtp({email,options:{shouldCreateUser:false}})`, then `verifyOtp({email,token,type:'email'})`. Password entry and password setup are not used.
- Codes are exactly six ASCII digits. The UI allows resend after 60 seconds; **server-side** verification, rate limits and expiration must be enforced by Supabase Auth, not the UI timer.
- An authenticated identity is **not sufficient**. `/api/staff/session` and staff operations must verify the current active row in `nea.staff_members`. Revoking an active membership removes dashboard access. Invalid/disabled staff get no access.
- Signed-in sessions are handled by existing `@supabase/ssr` cookies. No new client-side token storage, elevated key or custom OTP table is introduced.

## Required Supabase Auth configuration per environment

Supabase sends a **Magic Link** by default when `signInWithOtp` is called. To send a numeric code instead, edit **Authentication → Email Templates → Magic Link or OTP** in the intended Supabase project and replace the template body with the **canonical branded HTML** in [`supabase/email-templates/staff-otp.html`](../supabase/email-templates/staff-otp.html). Keep the template subject `NEA 1889 — Dein Anmeldecode`.

This is a **dashboard-managed setting**, not an automatically deployed SQL migration: copy the complete HTML into the intended environment's editor and save. Reopen to confirm that `{{ .Token }}` occurs exactly once and `{{ .ConfirmationURL }}` is absent; then send and inspect one approved test OTP. Do not paste an example code or fixed test code into the email.

**Brand:** mirrors the existing reservation email in `lib/email.ts`: soot `#0E0C07`, dark card `#17130B`, plaster `#EDE4D8`, ochre `#C58C42`, muted `#B9AFA0`, NEA wordmark and Napoli/Berlin motto. All styles are inline and the email requires no external images or webfonts.


Use a single-use **300-second expiry** in **Authentication → Providers → Email → Email OTP Expiration**. Retain Supabase's server-side rate limits; test a second request inside 60 seconds and code expiry/invalid attempts. Keep public Auth sign-ups disabled, and never allow staff access based solely on possession of an Auth account.

Preview project: `lyichglmkpeyyajkyucz` only. Authorized existing identities:
- Admin: `larneygee+test+nea-admin@gmail.com`
- Staff: `larneygee+test+nea-staff@gmail.com`

Preview Site URL should remain the protected `/login` URL from the Preview deployment. The protected Vercel URL must be accessible to testers via Vercel Authentication; do not bypass deployment protection.

**Production is not configured by this PR.** Before public activation, use the approved Resend Auth email delivery path (review SMTP credentials, verified sender, rate limits, deliverability and monitoring). Resend reservation emails in `lib/email.ts` do not automatically configure Supabase Auth emails. Do not apply Preview settings to Production without separate Founder authorization.

## Acceptance checklist

1. Use an approved existing identity to request a code; verify a six-digit code email is received and that an incorrect/expired code fails.
2. A successful OTP verification creates a cookie session and sends Admin or Staff to the existing dashboard, with the correct role and usable reservations.
3. Unknown email addresses cannot create accounts or gain access; disabled and nonmember users get 403.
4. Sending code twice within the limit is rate-limited; login works after a refresh using the existing cookie session; logout revokes client session.
5. Confirm navigation from /login to /admin, narrow-screen layout, keyboard navigation and screen-reader labeling.
6. Verify exact-head CI (tests, typecheck, build) and one protected Preview deployment before Founder manually merges. Do not change DNS or `nea1889.pizza`.
