import { NextRequest, NextResponse } from "next/server";
import { getConferenceById, getConferenceBySlug, getRegistrationByEmail, getRegistrationById } from "@/lib/supabase";
import { dispatchConfirmationEmail } from "@/lib/email/delivery";

const rateMemory = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rateMemory.get(key);
  if (!entry || entry.resetAt < now) {
    rateMemory.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) {
    return true;
  }
  entry.count += 1;
  rateMemory.set(key, entry);
  return false;
}

// Public endpoint to request a resend without revealing existence of registration.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const registrationId = body?.registrationId as string | undefined;
    const email = (body?.email as string | undefined)?.toLowerCase().trim();
    const conferenceSlug = body?.conferenceSlug as string | undefined;

    const ip =
      req.ip ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rateKey = `${ip}:${email ?? registrationId ?? "none"}`;
    if (isRateLimited(rateKey)) {
      return NextResponse.json(
        { ok: true, message: "Nëse ekziston një regjistrim, email-i do të ridërgohet së shpejti." },
        { status: 200 }
      );
    }

    let registration = registrationId ? await getRegistrationById(registrationId) : null;

    let conference = registration
      ? await getConferenceById(registration.conference_id)
      : await getConferenceBySlug(conferenceSlug);

    if (!registration && email && conference) {
      registration = await getRegistrationByEmail(email, conference.id);
    }

    if (!conference && registration) {
      conference = await getConferenceById(registration.conference_id);
    }

    if (registration && conference) {
      await dispatchConfirmationEmail({
        registration,
        conference,
        type: "self_resend",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Nëse ekziston një regjistrim me këtë adresë, email-i i konfirmimit do të dërgohet.",
    });
  } catch (error) {
    console.error("[/api/resend-public] Error:", error);
    return NextResponse.json({
      ok: true,
      message: "Kërkesa u pranua. Nëse ekziston një regjistrim, email-i do të ridërgohet.",
    });
  }
}
