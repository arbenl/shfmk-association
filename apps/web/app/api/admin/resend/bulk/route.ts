import { NextRequest, NextResponse } from "next/server";
import { getConferenceById, getRegistrationById } from "@/lib/supabase";
import { dispatchConfirmationEmail } from "@/lib/email/delivery";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const registrationIds = body?.registrationIds as string[] | undefined;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ ok: false, error: "registrationIds required" }, { status: 400 });
    }

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const id of registrationIds) {
      const registration = await getRegistrationById(id);
      if (!registration) {
        results.push({ id, ok: false, error: "not found" });
        continue;
      }
      if (registration.is_spam || registration.archived) {
        results.push({ id, ok: false, error: "blocked" });
        continue;
      }
      const conference = await getConferenceById(registration.conference_id);
      if (!conference) {
        results.push({ id, ok: false, error: "conference missing" });
        continue;
      }
      const res = await dispatchConfirmationEmail({
        registration,
        conference,
        type: "admin_resend",
      });
      results.push({ id, ok: res.success, error: res.success ? undefined : res.error });
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;

    return NextResponse.json({ ok: true, sent, failed, results });
  } catch (error) {
    console.error("[admin][resend][bulk] error", error);
    return NextResponse.json({ ok: false, error: "Bulk resend failed" }, { status: 500 });
  }
}
