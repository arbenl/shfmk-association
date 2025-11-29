export const CONFERENCE_SLUG = process.env.CONFERENCE_SLUG ?? "annual-conference";
export const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";
// Important: Handle escaped newlines from .env files for the PEM key
export const QR_PRIVATE_KEY_PEM = process.env.QR_PRIVATE_KEY_PEM?.replace(/\\n/g, '\n');
export const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
export const JWT_SECRET = process.env.JWT_SECRET ?? ADMIN_SECRET;
export const SITE_BASE_URL =
  process.env.SITE_BASE_URL ?? "http://localhost:3000";
export const NODE_ENV = process.env.NODE_ENV;

/**
 * Checks that all required server-side environment variables are present.
 * Throws an error if any are missing.
 */
export function ensureServerEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  if (!RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!RESEND_FROM_EMAIL) missing.push("RESEND_FROM_EMAIL");

  // In production, we strictly require the private key for security.
  // In dev, we can fallback to generated keys (handled in API).
  if (NODE_ENV === 'production' && !QR_PRIVATE_KEY_PEM) {
    missing.push("QR_PRIVATE_KEY_PEM");
  }

  if (missing.length > 0) {
    // This error is caught by the API route's try/catch block.
    // We log it here too for visibility in server logs.
    console.error(`[Server Config] Missing required env vars: ${missing.join(", ")}`);
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}
