export const CONFERENCE_SLUG = process.env.CONFERENCE_SLUG ?? "annual-conference";
export const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";
export const QR_PRIVATE_KEY_PEM = process.env.QR_PRIVATE_KEY_PEM;
export const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
export const SITE_BASE_URL =
  process.env.SITE_BASE_URL ?? "http://localhost:3000";

export function ensureServerEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  if (!RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!RESEND_FROM_EMAIL) missing.push("RESEND_FROM_EMAIL");

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}
