
# NEA 1889 Lovable-to-Next.js visual port

- Source: approved Lovable project https://lovable.dev/projects/ab59382d-5213-4a89-a21e-00de41f6afca
- Reference snapshot: PR #8, Lovable revision 8e53de56ec688babd5a075ddb3ff03a4b5e48af7.
- Main baseline: 50e020624b5d60d999ed02c89f83f81d79513b8f. PRs #6 and #7 explicitly deferred by Founder.
- This change uses the reference's visual palette, typography intent, editorial sections, and menus but **does not claim pixel-perfect source artwork fidelity**. Some Lovable brochure assets are only accessible via proprietary .asset.json URLs and are not bundled in the GitHub repository; approved legacy repo photo/logo are reused for now. Original approved campaign assets must be transferred as a separate review before release.
- Routes: / home, /speisekarte placeholder menu, /reservierung working existing POST /api/booking form, /impressum draft, /datenschutz draft. Legacy /reservation status and protected /admin routes remain untouched.
- No Supabase/Resend/migration, no changes to reservation SQL/business rules, no real menu prices or allergens.
- The existing booking request remains **pending**, not confirmed, after submission. Booking status management continues via the existing token URL.
- Legal pages are marked draft. They are not yet publication-ready; the privacy checkbox now links to the local /datenschutz draft for preview.
- Follow-up before release: verify true visual fidelity and responsive screenshots, source assets, restaurant hours/shift configuration, legal content, operator details, real menu/allergen/pricing; then complete Supabase and Resend phases.
