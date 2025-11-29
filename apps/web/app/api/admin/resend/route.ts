import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/adminAuth";
import { getConferenceById, getRegistrationById } from "@/lib/supabase";
import { createQrDataUrl } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";

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

  const qrDataUrl = await createQrDataUrl(registration.qr_token);
  await sendConfirmationEmail({
    to: registration.email,
    fullName: registration.full_name,
    qrDataUrl,
    conferenceName: conference.name,
    conferenceLocation: conference.location,
    conferenceStartDate: conference.start_date,
    conferenceEndDate: conference.end_date,
    category: registration.category,
    fee: registration.fee_amount,
    currency: registration.currency
  });

  return NextResponse.json({ success: true });
}
