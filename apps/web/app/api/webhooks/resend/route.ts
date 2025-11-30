import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getOutboxByProviderId,
  updateEmailOutboxStatus,
  updateRegistrationEmailMeta,
} from "@/lib/supabase";
import { RESEND_WEBHOOK_SECRET } from "@/lib/env";

function verifySignature(rawBody: string, signature: string | null) {
  if (!RESEND_WEBHOOK_SECRET) return true;
  if (!signature) return false;
  const digest = crypto.createHmac("sha256", RESEND_WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

function mapStatus(eventType: string) {
  const type = eventType.toLowerCase();
  if (type.includes("delivered")) return { status: "sent", markSent: true };
  if (type.includes("bounce")) return { status: "bounced", markSent: false };
  if (type.includes("complaint") || type.includes("spam")) return { status: "complained", markSent: false };
  return { status: "pending", markSent: false };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-resend-signature") || req.headers.get("svix-signature") || null;

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error("[resend webhook] invalid JSON", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventType = payload?.type || payload?.event || "unknown";
  const providerId =
    payload?.data?.id ||
    payload?.data?.email_id ||
    payload?.data?.message_id ||
    payload?.id ||
    payload?.message_id ||
    null;

  if (!providerId) {
    console.warn("[resend webhook] missing provider id", { payload });
    return NextResponse.json({ ok: true });
  }

  const outbox = await getOutboxByProviderId(providerId);
  if (!outbox) {
    console.warn("[resend webhook] outbox entry not found for provider id", providerId);
    return NextResponse.json({ ok: true });
  }

  const { status, markSent } = mapStatus(eventType);
  const lastError: string | null = payload?.data?.error ?? payload?.data?.reason ?? null;

  await updateEmailOutboxStatus(outbox.id, {
    status,
    provider_id: providerId,
    last_error: lastError,
  });

  await updateRegistrationEmailMeta(outbox.registration_id, {
    status,
    lastError,
    markSent,
    incrementAttempts: false,
  });

  return NextResponse.json({ ok: true });
}
