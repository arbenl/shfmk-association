#!/usr/bin/env node
import 'dotenv/config';

const email = process.argv[2];
if (!email) {
  console.error("Usage: ADMIN_SECRET_KEY=... node apps/web/scripts/send-test-pdf-email.mjs <email>");
  process.exit(1);
}

const adminKey = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET;
if (!adminKey) {
  console.error("ADMIN_SECRET_KEY is required in env.");
  process.exit(1);
}

const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function main() {
  const res = await fetch(`${baseUrl}/api/admin/resend-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Request failed:", res.status, data);
    process.exit(1);
  }
  console.log("OK", data);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
