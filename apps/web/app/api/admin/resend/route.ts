import { NextRequest, NextResponse } from "next/server";
import { getRegistrationById, getConferenceById } from "@/lib/supabase";
import { dispatchConfirmationEmail } from "@/lib/email/delivery";

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

    const result = await dispatchConfirmationEmail({
      registration,
      conference,
      type: "admin_resend",
    });

    return NextResponse.json({
      ok: result.success,
      providerId: result.providerId ?? null,
      emailSent: result.success,
      error: result.success ? undefined : result.error,
    });
  } catch (error) {
    console.error("Admin Resend Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to resend email" }, { status: 500 });
  }
}
