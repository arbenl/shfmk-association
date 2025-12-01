export const CONFERENCE_SLUG = (process.env.CONFERENCE_SLUG ?? "annual-conference").trim();
export const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""
).trim();
export const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY ?? "").trim();
export const ADMIN_AUTH_DEBUG = process.env.ADMIN_AUTH_DEBUG === "true";

function cleanEnv(value?: string | null): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export const RESEND_API_KEY = cleanEnv(process.env.RESEND_API_KEY);
export const RESEND_FROM_EMAIL = cleanEnv(process.env.RESEND_FROM_EMAIL);
export const RESEND_WEBHOOK_SECRET = cleanEnv(process.env.RESEND_WEBHOOK_SECRET);
// Important: Handle escaped newlines from .env files for the PEM key
export const QR_PRIVATE_KEY_PEM = process.env.QR_PRIVATE_KEY_PEM?.replace(/\\n/g, "\n");

export const ADMIN_SECRET_KEY = cleanEnv(process.env.ADMIN_SECRET_KEY ?? process.env.ADMIN_SECRET ?? "");
export const ADMIN_SECRET = ADMIN_SECRET_KEY;
export const SITE_BASE_URL =
  cleanEnv(process.env.NEXT_PUBLIC_BASE_URL) ||
  cleanEnv(process.env.SITE_BASE_URL) ||
  "http://localhost:3000";
export const NODE_ENV = process.env.NODE_ENV;

/**
 * Checks that all required server-side environment variables are present.
 * Throws an error if any are missing.
 */
export function ensureServerEnv(options?: { requireEmailEnv?: boolean }) {
  const requireEmailEnv = options?.requireEmailEnv ?? true;
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  if (requireEmailEnv) {
    if (!RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!RESEND_FROM_EMAIL) missing.push("RESEND_FROM_EMAIL");
  }
  if (!ADMIN_SECRET_KEY) missing.push("ADMIN_SECRET_KEY");

  // In production, we strictly require the private key for security.
  // In dev, we can fallback to generated keys (handled in API).
  if (NODE_ENV === "production" && !QR_PRIVATE_KEY_PEM) {
    missing.push("QR_PRIVATE_KEY_PEM");
  }

  if (missing.length > 0) {
    console.error(`[Server Config] Missing required env vars: ${missing.join(", ")}`);
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}
