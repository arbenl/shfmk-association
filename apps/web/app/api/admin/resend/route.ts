import { NextRequest, NextResponse } from "next/server";
import { getRegistrationById, getConferenceById } from "@/lib/supabase";
import { createQrBuffer } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  // Auth is handled by middleware

  try {
    const body = await req.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json({ ok: false, error: "Missing registrationId" }, { status: 400 });
    }

    // 2. Fetch Registration
    const registration = await getRegistrationById(registrationId);
    if (!registration) {
      return NextResponse.json({ ok: false, error: "Registration not found" }, { status: 404 });
    }

    // 3. Fetch Conference
    const conference = await getConferenceById(registration.conference_id);
    if (!conference) {
      return NextResponse.json({ ok: false, error: "Conference not found" }, { status: 404 });
    }

    // 4. Generate QR Buffer
    const qrBuffer = await createQrBuffer(registration.qr_token);

    // 5. Send Email
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
    console.error("Admin Resend Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to resend email" }, { status: 500 });
  }
}
