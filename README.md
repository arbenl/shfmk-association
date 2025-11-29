# SHFMK Conference Registration + Offline Scanner

Monorepo for Shoqata Farmaceutike e Kosovës (SHFMK) registration (Next.js) and offline QR scanner (Expo). QR codes embed RS256-signed JWTs so check-in works without network.

## Structure

- `apps/web` — Next.js 14 app (App Router) with public registration, success page, admin list/export/resend, API for registration.
- `apps/scanner` — Expo app for offline scanning, verification with public key, local check-ins, export.
- `packages/shared` — Shared TypeScript helpers for JWT sign/verify and keypair generation.
- `supabase/schema.sql` — Tables + seed conference row.

## Setup

1) Install deps
```bash
pnpm install
```

2) Supabase schema
```bash
pnpm dlx supabase db push --file supabase/schema.sql
```
or run the SQL directly.

3) Env files
- Copy `apps/web/.env.example` to `.env.local` (or `.env`) and fill values.
- Copy `apps/scanner/.env.example` to `.env` and set `EXPO_PUBLIC_QR_PUBLIC_KEY_PEM`.

4) Generate RSA keys (PEM)
```bash
openssl genpkey -algorithm RSA -out qr_private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in qr_private.pem -out qr_public.pem
```
Set `QR_PRIVATE_KEY_PEM` (web) to the private key contents, and `EXPO_PUBLIC_QR_PUBLIC_KEY_PEM` (scanner) to the public key.

5) Run apps
```bash
pnpm -C apps/web dev       # Next.js on http://localhost:3000
pnpm -C apps/scanner start # Expo dev server (choose device)
```

## How to run quickly
- Install deps from repo root: `pnpm install`
- Web in dev mode: `pnpm -C apps/web dev` (or `pnpm dev:web`)
- Scanner in dev mode: `pnpm -C apps/scanner start` (or `pnpm dev:scanner`)
- Scanner fixes & clean run:
  ```bash
  cd apps/scanner
  npx expo install --fix
  npx expo-doctor
  pnpm -C apps/scanner exec expo start -c
  ```

## Demo mode
If `QR_PRIVATE_KEY_PEM` (web) or `EXPO_PUBLIC_QR_PUBLIC_KEY_PEM` (scanner) are missing in dev, a temporary in-memory keypair is generated and a warning is logged. Copy the console public key into the scanner env to validate those tokens.

## Supabase tables
- `conferences` — conference metadata + fees per category.
- `registrations` — attendee records, QR token, fee, timestamps.

Seeded conference slug: `annual-conference`.

## Notes
- Admin uses header `x-admin-secret` against `ADMIN_SECRET` env.
- QR token payload: `{ sub, name, cat, conf, fee, cur, iat }`, signed RS256.
- Email: Resend with inline QR DataURL; success page always shows QR even if email fails.
