# Release Notes — 2025-11-30 (v0.1.1)

## Highlights
- Added end-to-end Resend email delivery: admin test endpoint, bulk/admin/self resend, webhook status updates, and outbox tracking.
- Registration flow now uses two categories (farmacist/teknik) with fixed fees and participation points surfaced in confirmations.
- QR codes now encode the public verify URL; success page and emails show participation type and points.

## Admin & Ops
- Admin dashboard shows email delivery status with filters and a bulk resend action.
- New scripts: `apps/web/scripts/email-doctor.mjs` to validate email env, `test-admin-test-email.sh` to exercise the admin test endpoint.
- RUNBOOK and email setup docs updated with new env vars (`ADMIN_SECRET_KEY`, `RESEND_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL`) and webhook guidance.

## Backend & API
- New endpoints: `/api/admin/test-email`, `/api/admin/resend-confirmation`, `/api/admin/resend/bulk`, `/api/resend-public`, and `/api/webhooks/resend`.
- Registration API enforces the new categories, calculates fixed fees, and records participation metadata; duplicate submissions return a friendly ALREADY_REGISTERED response.
- Check-in API now uses `x-admin-key` and the renamed `ADMIN_SECRET_KEY` env.

## Database
- Migration `20241202_email_delivery.sql`: email status/attempts columns, outbox table with indexes and timestamp trigger.
- Migration `20241204_categories_points.sql`: restrict categories to `farmacist|teknik`, add participation type/points defaults, and backfill existing rows.

