## SHFK Email Setup (Resend + Vercel)

### Domain Verification Checklist (shfk.org)
- Add SPF: `v=spf1 include:amazonses.com include:mailersend.net include:sendgrid.net include:spf.resend.com ~all` (merge with existing; keep one SPF).
- Add DKIM records from Resend dashboard for `shfk.org` (three CNAMEs). Wait for Resend to show `verified`.
- Optional DMARC: `v=DMARC1; p=quarantine; rua=mailto:postmaster@shfk.org` (tighten to `p=reject` after monitoring).
- In Resend, set the default FROM domain to `shfk.org` and add sender `Konferenca SHFK <konferenca@shfk.org>`.
- Configure Resend webhook: URL `https://shfk.org/api/webhooks/resend`, subscribe to delivered/bounced/complained, store signing secret in `RESEND_WEBHOOK_SECRET`.

### Vercel Environment Variables
- `RESEND_API_KEY` – from Resend dashboard (Project -> API Keys).
- `RESEND_FROM_EMAIL` – e.g. `Konferenca SHFK <konferenca@shfk.org>`.
- `RESEND_WEBHOOK_SECRET` – signing secret for webhook verification.
- `ADMIN_SECRET_KEY` – long random string used for `x-admin-key` header.
- `NEXT_PUBLIC_BASE_URL` – `https://shfk.org` (public URL used in links/QRs).
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `QR_PRIVATE_KEY_PEM` (existing).
- Add these in Vercel Project Settings → Environment Variables for Production/Preview.

### How to Test (curl)
- Send test email (admin-only):
```bash
curl -X POST "https://shfk.org/api/admin/test-email" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SECRET_KEY" \
  -d '{"to":"you@example.com"}'
```
- Resend confirmation by registration ID:
```bash
curl -X POST "https://shfk.org/api/admin/resend-confirmation" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SECRET_KEY" \
  -d '{"registrationId":"<uuid>"}'
```
- Resend confirmation by email (uses current conference slug):
```bash
curl -X POST "https://shfk.org/api/admin/resend-confirmation" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SECRET_KEY" \
  -d '{"email":"person@shfk.org"}'
```
- Public self-resend (generic, rate-limited):
```bash
curl -X POST "https://shfk.org/api/resend-public" \
  -H "Content-Type: application/json" \
  -d '{"email":"person@shfk.org"}'
```
- Local doctor script (no secrets printed):
```bash
node apps/web/scripts/email-doctor.mjs
```

### Troubleshooting
- Email blocked: check Resend dashboard suppressions/bounces; clear suppression before retrying.
- Domain not verified: ensure DKIM CNAMEs are propagated; SPF/DMARC not required for Resend verification but recommended.
- Wrong FROM: confirm Vercel `RESEND_FROM_EMAIL` matches `@shfk.org` and is verified in Resend.
- Spam folder: add DMARC, ensure message has plain text fallback (Resend handles), keep links pointing to `https://shfk.org`.
- Missing env: use the doctor script; API logs show `[email][config][error]` when misconfigured.
- Webhook silent: ensure `RESEND_WEBHOOK_SECRET` matches Resend settings and webhook subscribes to delivered/bounced/complained events.
