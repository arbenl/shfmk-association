import { NextRequest, NextResponse } from "next/server";
import { getConferenceById, getRegistrationById } from "@/lib/supabase";
import { createQrBuffer } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";

// This is a public-facing route used by the success page to allow users to resend their own email.
// In a production environment, this should be rate-limited to prevent abuse.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const registrationId = body?.registrationId as string | undefined;

    if (!registrationId) {
      return NextResponse.json({ ok: false, error: "ID e regjistrimit mungon.", code: "MISSING_REGISTRATION_ID" }, { status: 400 });
    }

    const registration = await getRegistrationById(registrationId);
    if (!registration) {
      return NextResponse.json({ ok: false, error: "Regjistrimi nuk u gjet.", code: "REG_NOT_FOUND" }, { status: 404 });
    }

    const conference = await getConferenceById(registration.conference_id);
    if (!conference) {
      return NextResponse.json({ ok: false, error: "Konferenca nuk u gjet.", code: "CONF_NOT_FOUND" }, { status: 404 });
    }

    const qrBuffer = await createQrBuffer(registration.qr_token);
    await sendConfirmationEmail({
      to: registration.email,
      fullName: registration.full_name,
      qrBuffer,
      conferenceName: conference.name,
      conferenceLocation: conference.location,
      conferenceStartDate: conference.start_date,
      conferenceEndDate: conference.end_date,
      category: registration.category,
      fee: registration.fee_amount,
      currency: registration.currency
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("[/api/resend-public] Error:", error);
    return NextResponse.json({ ok: false, error: "Dërgimi i email-it dështoi.", code: "EMAIL_SEND_FAILED" }, { status: 500 });
  }
}
