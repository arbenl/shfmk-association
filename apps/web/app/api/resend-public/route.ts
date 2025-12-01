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
    return { limited: false, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { limited: true, remaining: 0 };
  }
  entry.count += 1;
  rateMemory.set(key, entry);
  return { limited: false, remaining: RATE_LIMIT - entry.count };
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
    const rate = isRateLimited(rateKey);
    if (rate.limited) {
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: "Kërkesa e ridërgimit u kufizua. Provo sërish pas 15 minutash.",
        },
        { status: 429 }
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
      const result = await dispatchConfirmationEmail({
        registration,
        conference,
        type: "self_resend",
      });

      if (!result.success) {
        console.error("[/api/resend-public] send failed", {
          registrationId: registration.id,
          email,
          error: result.error,
        });
        return NextResponse.json(
          {
            ok: false,
            code: "SEND_FAILED",
            error: result.error ?? "Dërgimi dështoi.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Nëse ekziston një regjistrim me këtë adresë, email-i i konfirmimit do të dërgohet.",
    });
  } catch (error) {
    console.error("[/api/resend-public] Error:", error);
    return NextResponse.json({
      ok: false,
      code: "UNEXPECTED_ERROR",
      error: "Kërkesa dështoi. Ju lutemi provoni përsëri.",
    });
  }
}
