# Vercel Deployment & Monorepo Stabilization Guide

## 1. Diagnosis

The deployment issues were caused by a combination of factors:

- **Corrupted `packages/shared/package.json`**: It contained the root package content, breaking the workspace link.
- **Package Manager Mismatch**: Root used `pnpm@9.12.2` while `apps/web` tried to use `pnpm@10.23.0`.
- **Config Format Mismatch**: `apps/web` is an ESM module (`"type": "module"`), but Tailwind/PostCSS configs were using CommonJS syntax without the `.cjs` extension or ESM syntax that wasn't fully compatible with the build tools.
- **Missing Vercel Configuration**: No `vercel.json` to tell Vercel how to handle the monorepo build structure.

## 2. Fixes Applied

### Root `package.json`

Standardized to `pnpm@9.12.2` and added filter-based scripts.

```json
{
  "name": "shfmk",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@9.12.2",
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "build:all": "pnpm -r build"
  }
}
```

### `apps/web/package.json`

Cleaned up scripts and removed conflicting `packageManager` field.

### `packages/shared/package.json`

Restored correct package definition.

```json
{
  "name": "@shfmk/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./jwt": "./src/jwt.ts"
  }
}
```

### Config Files

- **`apps/web/tailwind.config.js`**: Converted to CommonJS format.
- **`apps/web/postcss.config.js`**: Converted to CommonJS format.
- **`apps/web/vercel.json`**: Created to define build behavior.

### Code Improvements

- **`lib/env.ts`**: Added strict validation for `QR_PRIVATE_KEY_PEM` in production.
- **`/api/register`**: Improved error handling for duplicates (returns 429 with friendly message) and ensures atomic registration.
- **Registration UI**: Added green success messages for resent emails.

## 3. Local Commands to Run (In Order)

Run these commands to clean your environment and verify the fix:

```bash
# 1. Clean old artifacts
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -f pnpm-lock.yaml

# 2. Install dependencies (generates correct pnpm-lock.yaml)
pnpm install

# 3. Verify Build (simulates Vercel)
pnpm --filter web build
```

## 4. Vercel Configuration

Go to your Vercel Project Settings and ensure these values are set:

- **Root Directory**: `apps/web`
- **Framework Preset**: `Next.js`
- **Install Command**: `cd ../.. && pnpm install`
- **Build Command**: `cd ../.. && pnpm --filter web build`
- **Include files outside root directory**: **Enabled** (Required!)

### Environment Variables (Production)

Set these in Vercel:

- `SUPABASE_URL`: (Your Supabase URL)
- `SUPABASE_SERVICE_KEY`: (Your Service Role Key)
- `RESEND_API_KEY`: (Your Resend API Key)
- `RESEND_FROM_EMAIL`: `noreply@yourdomain.com` (or `onboarding@resend.dev` for testing)
- `QR_PRIVATE_KEY_PEM`: (The content of your private key - handle newlines correctly!)
- `SITE_BASE_URL`: `https://your-project.vercel.app`

## 5. Verification Checklist

- [x] **Local Build**: `pnpm --filter web build` passes.
- [x] **Registration**: `/api/register` handles new and duplicate registrations correctly.
- [x] **Email**: Confirmation emails are sent with QR codes.
- [x] **Scanner**: App is configured correctly (offline support verified).
- [ ] **Vercel Deployment**: Push these changes and watch the build succeed!
