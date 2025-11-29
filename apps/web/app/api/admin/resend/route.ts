import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/adminAuth";
import { getConferenceById, getRegistrationById, saveQrToken } from "@/lib/supabase";
import { createQrDataUrl } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";
import { QR_PRIVATE_KEY_PEM } from "@/lib/env";
import { RegistrationTokenPayload, signRegistrationToken } from "@shfmk/shared";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  try {
    verifyAdminSecret(secret);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const registrationId = body?.registrationId as string | undefined;
  if (!registrationId) {
    return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
  }

  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  const conference = await getConferenceById(registration.conference_id);
  if (!conference) {
    return NextResponse.json({ error: "Conference not found" }, { status: 404 });
  }

  let token = registration.qr_token;
  if (!token) {
    const payload: RegistrationTokenPayload = {
      sub: registration.id,
      name: registration.full_name,
      cat: registration.category,
      conf: conference.slug,
      fee: registration.fee_amount,
      cur: registration.currency,
      iat: Math.floor(new Date(registration.created_at).getTime() / 1000)
    };
    const signed = await signRegistrationToken(payload, QR_PRIVATE_KEY_PEM);
    token = signed.token;
    await saveQrToken(registration.id, token);
  }

  const qrDataUrl = await createQrDataUrl(token);
  await sendConfirmationEmail({
    to: registration.email,
    fullName: registration.full_name,
    qrDataUrl,
    conferenceName: conference.name,
    category: registration.category,
    fee: registration.fee_amount,
    currency: registration.currency
  });

  return NextResponse.json({ success: true });
}
