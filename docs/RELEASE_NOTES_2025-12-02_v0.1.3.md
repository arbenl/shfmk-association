# Release Notes – 2025-12-02 (v0.1.3)

## Highlights
- Public conference pages now degrade gracefully with a “Së shpejti” state and refreshed hero/agenda sections driven by Supabase content.
- Volunteer-facing `/scanner` page ships download tiles and an embedded quick-start guide for Android/iOS builds.
- Registration experience rebuilt with client-side validation and clearer success/payment blocks; QR shown inline on success.

## Details by area
- **Scanner & check-in** – `/scanner` publishes Android/iOS download links plus a 5-step volunteer guide (secrets via `x-admin-key`). Check-in remains scanner-only via the API; the public `/verify` page now only validates tokens and never mutates check-in state (read-only confirmation with status messaging).
- **Registration & categories/fees/points** – Registration form is client-side with inline validation and “already registered” resend path. When a conference is unpublished, registration shows a “hapet së shpejti” gate. Fees and categories surface as Farmacist/Teknik across hero CTA, admin CMS, success page, and email/PDF. OFK points are explicitly shown (12 pasiv / 15 aktiv) in UI, email, PDF, and success page. New migration enforces `conferences.start_date` as `timestamptz`.
- **Admin auth/session** – Login page redirects authenticated admins; middleware now enforces allowlist lookups and redirects unauthorized users to `/admin/login` with error context. Logout API signs out and redirects; UI header uses a dedicated `LogoutButton`. Added bash smoke test (`apps/web/scripts/test-admin-logout.sh`) for session regression.
- **Email/QR delivery** – Confirmation emails attach a PDF ticket containing the QR (no inline QR in the email body). Success page renders the QR inline, offers print + resend. Payment block is consistent across email, PDF, and success screen.
- **Navigation/i18n** – `/konferenca` canonicalizes to `/#konferenca`; header swaps between conference nav and contact-only mode depending on published state. Coming-soon hero provides Albanian contact copy; admin agenda editor supports form and JSON modes with validation.
- **Scanner guide reference** – Volunteer guide remains available at `docs/VOLUNTEER_SCANNER_GUIDE_AL.md` alongside the in-page quick steps.

## QA completed
- `pnpm -C apps/web build`
- `ecohub-qa navigation_audit`
- `ecohub-qa runtime_log_scan`
- `ecohub-qa env_audit` (only optional vars noted: `NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS`, `SUPABASE_DB_URL`)
- `ecohub-qa build_health`
