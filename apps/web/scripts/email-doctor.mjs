#!/usr/bin/env node

/**
 * Quick, non-secret email configuration doctor.
 * Prints presence/shape of required env vars without leaking values.
 */
const hasResendKey = Boolean(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "";
const adminKey =
  process.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET || "";
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.SITE_BASE_URL ||
  "http://localhost:3000";
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || "";

const report = {
  RESEND_API_KEY: hasResendKey ? "set" : "missing",
  RESEND_FROM_EMAIL: fromEmail ? fromEmail : "missing",
  ADMIN_SECRET_KEY: adminKey ? "set" : "missing",
  BASE_URL: baseUrl,
  RESEND_WEBHOOK_SECRET: webhookSecret ? "set" : "missing",
  fromDomainOk: fromEmail.includes("@shfk.org"),
};

console.log("Email doctor:");
console.table(report);

if (!hasResendKey || !fromEmail) {
  console.log(
    "Missing values detected. Ensure RESEND_API_KEY and RESEND_FROM_EMAIL are configured in Vercel."
  );
}

if (!report.fromDomainOk) {
  console.log(
    "Warning: RESEND_FROM_EMAIL is not on @shfk.org. Update it to use the verified domain."
  );
}
