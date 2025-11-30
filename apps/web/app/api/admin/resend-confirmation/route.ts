import { NextRequest, NextResponse } from "next/server";
import {
  getConferenceById,
  getConferenceBySlug,
  getRegistrationByEmail,
  getRegistrationById,
} from "@/lib/supabase";
import { dispatchConfirmationEmail } from "@/lib/email/delivery";
import { ADMIN_SECRET_KEY } from "@/lib/env";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key")?.trim();
  if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const registrationId = body?.registrationId as string | undefined;
  const email = (body?.email as string | undefined)?.toLowerCase().trim();

  if (!registrationId && !email) {
    return NextResponse.json(
      { ok: false, error: "Provide registrationId or email" },
      { status: 400 }
    );
  }

  try {
    let registration =
      registrationId && registrationId.length > 0
        ? await getRegistrationById(registrationId)
        : null;

    if (!registration && email) {
      const conference = await getConferenceBySlug();
      if (!conference) {
        return NextResponse.json(
          { ok: false, error: "Conference not found" },
          { status: 404 }
        );
      }
      registration = await getRegistrationByEmail(email, conference.id);
    }

    if (!registration) {
      return NextResponse.json(
        { ok: false, error: "Registration not found" },
        { status: 404 }
      );
    }

    const conference = await getConferenceById(registration.conference_id);
    if (!conference) {
      return NextResponse.json(
        { ok: false, error: "Conference not found" },
        { status: 404 }
      );
    }

    const providerResponse = await dispatchConfirmationEmail({
      registration,
      conference,
      type: "admin_resend",
    });

    return NextResponse.json({
      ok: providerResponse.success,
      registrationId: registration.id,
      providerId: providerResponse.providerId ?? null,
      emailSent: providerResponse.success,
      error: providerResponse.success ? undefined : providerResponse.error,
    });
  } catch (error) {
    console.error("[admin][resend-confirmation][error]", {
      error,
      registrationId,
      email,
    });
    return NextResponse.json(
      { ok: false, error: "Failed to resend confirmation email" },
      { status: 500 }
    );
  }
}
