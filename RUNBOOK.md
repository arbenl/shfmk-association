# Operator Runbook: SHFK Event

This document provides all necessary instructions for operators to run, test, and manage the event registration and check-in system.

## 1. Local Development and Testing

These commands should be run from the repository root.

**1.1. Install Dependencies**

```bash
pnpm install
```

**1.2. Generate QR Signing Keys**
This only needs to be done once. It will create `keys/qr_private.pem` and `keys/qr_public.pem`.

```bash
./scripts/generate-qr-keys.sh
```

This script will also print the exact environment variable lines to copy into your `.env.local` files.

**1.3. Set Up Environment Files**

* **Web App (`apps/web/.env.local`)**:
    Create this file and add the variables from `./scripts/generate-qr-keys.sh` and your Supabase/Resend keys.

    ```
    SUPABASE_URL="https://your-project.supabase.co"
    SUPABASE_SERVICE_KEY="your-supabase-service-role-key"
    RESEND_API_KEY="your-resend-api-key"
    RESEND_FROM_EMAIL="noreply@your-domain.com"
    RESEND_WEBHOOK_SECRET="your-resend-webhook-secret"
    QR_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n..."
    ADMIN_SECRET_KEY="a-secure-secret-for-admin-access"
    NEXT_PUBLIC_BASE_URL="http://localhost:3000"
    ```

* **Scanner App (`apps/scanner/.env`)**:
    Create this file and add the public key variable from the script output.

    ```
    EXPO_PUBLIC_QR_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n..."
    ```

**1.4. Run Local Servers**

* **Run Web App (Next.js)**:

    ```bash

pnpm -C apps/web dev

```
    The site will be available at `http://localhost:3000`.

*   **Run Scanner App (Expo)**:
    ```bash
pnpm -C apps/scanner start
```

    Scan the QR code with the Expo Go app on your mobile device.

**1.5. Test Registration API**
Use this `curl` command to test the registration endpoint directly.

```bash
curl -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","email":"test@example.com","category":"non_member"}'
```

**1.6. Build for Production**
To ensure all apps build correctly.

```bash
pnpm -r build
```

**1.7. Test email delivery**

Use the admin test endpoint (requires `ADMIN_SECRET_KEY`) to confirm Resend works with your domain:

```bash
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SECRET_KEY" \
  -d '{"to":"you@example.com"}'
```

Resend webhook testing: send a sample payload to `http://localhost:3000/api/webhooks/resend` with the `x-resend-signature` header (HMAC SHA-256 using `RESEND_WEBHOOK_SECRET`) to simulate delivered/bounce events.

---

## 2. Admin Access Control

### 2.1. Admin Login

The admin panel is protected by Supabase Authentication. Only users whose emails are in the `admin_users` table can access the dashboard.

**Access URL:**

```
http://localhost:3000/admin/login  (local)
https://your-domain.com/admin/login  (production)
```

**Login Process:**

1. Navigate to `/admin/login`
2. Enter your email and password (standard Supabase Auth)
3. The system checks if your email exists in the `admin_users` allowlist table.
4. On success, you are redirected to the dashboard.

**Protected Routes:**

* `/admin/*` - All admin pages
* `/api/admin/*` - All admin API routes

### 2.2. Managing Admins

To add a new admin, you must insert their email into the `admin_users` table in Supabase.

**SQL Command:**

```sql
insert into admin_users (email) values ('new.admin@example.com');
```

### 2.3. Admin Logout

Click the "Dil" (Logout) button in the admin header.

### 2.3. Registration Success Page

After successful registration, users are redirected to a stable URL:

```
/conference/register/success?rid=<registration-id>
```

**Example:**

```
http://localhost:3000/conference/register/success?rid=550e8400-e29b-41d4-a716-446655440000
```

**Key Features:**

* ✅ **Refresh-safe**: Page fetches data from server using `rid` parameter
* ✅ **Shareable**: URL can be bookmarked or shared
* ✅ **Recoverable**: If user loses email, they can use the resend button on this page

**Error Handling:**

* Missing `rid` parameter → Shows "Regjistrim i Pavlefshëm" error with return button
* Invalid `rid` → Shows "Regjistrimi me këtë ID nuk u gjet" error

### 2.4. Troubleshooting

**Problem: "Unauthorized" when accessing admin pages**

* **Cause:** Not logged in or session expired
* **Solution:** Navigate to `/admin/login` and enter the admin secret

**Problem: Redirect loop on admin pages**

* **Cause:** Invalid session cookie
* **Solution:** Clear browser cookies and log in again

**Problem: Registration success page shows error after refresh**

* **Cause:** This should NOT happen with the current implementation
* **Solution:** Verify the `rid` parameter is in the URL. If missing, user needs to re-register or check their email

---

## 3. Vercel Deployment Checklist

When deploying the `apps/web` application to Vercel, configure the following environment variables in the Vercel project settings.

| Variable                   | Description                                                    | Server-Only |
| -------------------------- | -------------------------------------------------------------- | ----------- |
| `SUPABASE_URL`             | Supabase project URL.                                          | Yes         |
| `SUPABASE_SERVICE_KEY`     | Supabase Service Role key (secret).                            | Yes         |
| `RESEND_API_KEY`           | API key for Resend email service.                              | Yes         |
| `RESEND_FROM_EMAIL`        | Verified sender, e.g. `Konferenca SHFK <konferenca@shfk.org>`. | Yes         |
| `RESEND_WEBHOOK_SECRET`    | Resend webhook signing secret (for /api/webhooks/resend).      | Yes         |
| `QR_PRIVATE_KEY_PEM`       | **Multi-line** private key for signing QRs.                    | Yes         |
| `ADMIN_SECRET_KEY`         | Admin API key used for protected endpoints.                    | Yes         |
| `CONFERENCE_SLUG`          | (Optional) Supabase slug for the conference.                   | Yes         |
| `NEXT_PUBLIC_BASE_URL`     | Public site URL (used in QR/email links).                      | No          |

### 3.1. Resend Webhook
- Endpoint: `https://shfk.org/api/webhooks/resend`
- Events: delivered, bounced, complained (Resend dashboard → Webhooks)
- Signing secret: set as `RESEND_WEBHOOK_SECRET` in Vercel; requests without/with bad signature are rejected.

---

## 4. Scanner App Distribution (for Volunteers)

The scanner app is designed for offline use. Check-ins are stored locally on the device and can be synced later.

**3.1. Set Production Public Key**
The public QR key must be available to the standalone app. Use EAS Secrets to set it.

1. Get the public key value from `./scripts/generate-qr-keys.sh`.
2. Run the following command in the `apps/scanner` directory:

    ```bash
    # In apps/scanner:
    npx eas secret create --scope project --name EXPO_PUBLIC_QR_PUBLIC_KEY_PEM --value "-----BEGIN PUBLIC KEY-----\n..."
    ```

**3.2. Build the Android APK**
From the `apps/scanner` directory, run an EAS build.

```bash
# In apps/scanner:
npx eas build --platform android --profile preview --local
```

This will generate an `.apk` file that can be shared directly with volunteers for installation on their Android devices.

**3.3. iOS Distribution (TestFlight)**
For iOS, you will need an Apple Developer account.

1. Build for iOS:

    ```bash
    # In apps/scanner:
    npx eas build --platform ios --profile preview
    ```

2. Follow the prompts to sign in to your Apple Developer account.
3. Once the build is complete, it will be available in App Store Connect.
4. Use the **TestFlight** section to invite volunteers via their email address to install the app.

---

## 5. Event-Day Checklist

**Before the Event:**

1. [ ] **Finalize Env Vars**: Double-check all production environment variables are set correctly in Vercel and EAS.
2. [ ] **Distribute Scanner**: Ensure all volunteers have the latest version of the scanner app installed and tested on their device.
3. [ ] **Train Volunteers**: Show volunteers how to scan, what the status colors mean (Green, Yellow, Red), and how to use the "Sync" feature.
4. [ ] **Set Admin Secret**: Provide the `ADMIN_SECRET_KEY` to the lead operator for accessing the admin dashboard and for the sync feature on the scanners.

**During the Event:**
5.  [ ] **Monitor Admin Dashboard**: Have the admin dashboard (`/admin/registrations`) open on a laptop to monitor incoming registrations.
6.  [ ] **Email Delivery**: Use the status chips on `/admin/registrations` to spot pending/failed emails and trigger **Bulk Ridërgo** for failed/pending rows.
7.  [ ] **Check Network**: Scanners work offline. If Wi-Fi is available, great. If not, don't worry.

**After the Event:**
8.  [ ] **Sync All Scanners**: Before volunteers leave, ensure each one connects to the internet and uses the "Sync" button to upload all their locally stored check-ins.
9.  [ ] **Verify Sync**: Check the admin dashboard or Supabase table to confirm the `checked_in_at` field is populated for the scanned attendees.
10. [ ] **Export Final Data**: Use the "Export CSV" button on the admin page to get the final list of all registered and checked-in attendees.
11. [ ] **Revoke Secrets**: (Optional but good practice) Rotate the `ADMIN_SECRET_KEY` after the event is complete.
