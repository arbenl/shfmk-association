import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { calculateFee, ensureCapacity, ensureRegistrationIsOpen } from "@/lib/fees";
import {
  countRegistrations,
  createRegistration,
  getConferenceBySlug,
  getRegistrationByEmail,
} from "@/lib/supabase";
import { RegistrationTokenPayload, signRegistrationToken } from "@shfmk/shared";
import { QR_PRIVATE_KEY_PEM, TURNSTILE_SECRET_KEY, ensureServerEnv } from "@/lib/env";
import { dispatchConfirmationEmail } from "@/lib/email/delivery";
import { enforceRegistrationRateLimit } from "@/lib/rate-limit";

// Schema for validating the request body
const inputSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name is required")
    .max(80, "Name too long")
    .refine((val) => !/^[A-Za-z0-9]{18,}$/.test(val.replace(/\s+/g, "")), {
      message: "Emri duket i pavlefshëm.",
    }),
  email: z
    .string()
    .email("Invalid email")
    .max(320, "Email is too long")
    .transform((v) => v.trim().toLowerCase()),
  phone: z.string().optional(),
  institution: z.string().optional(),
  category: z.enum(["farmacist", "teknik"]),
  turnstileToken: z.string().min(10, "Verification required"),
  website: z.string().optional(), // honeypot
});

function getClientIp(req: NextRequest) {
  return req.ip ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

async function verifyTurnstile(token: string, ip: string | null) {
  if (!TURNSTILE_SECRET_KEY) {
    throw new Error("Turnstile secret key missing");
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip ?? "",
    }),
  });

  if (!res.ok) {
    throw new Error("Turnstile verification failed");
  }

  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate environment and request body (allow registration even if email env missing)
    ensureServerEnv({ requireEmailEnv: false, requireTurnstile: true });
    const body = await req.json();
    const input = inputSchema.parse(body);
    const ip = getClientIp(req);

    if (input.website && input.website.trim().length > 0) {
      return NextResponse.json({ ok: false, error: "Regjistrimi dështoi", code: "INVALID_INPUT" }, { status: 400 });
    }

    enforceRegistrationRateLimit(ip, input.email);

    const turnstileOk = await verifyTurnstile(input.turnstileToken, ip);
    if (!turnstileOk) {
      return NextResponse.json({ ok: false, error: "Verifikimi dështoi", code: "BOT_DETECTED" }, { status: 400 });
    }

    // 2. Get conference details
    const conference = await getConferenceBySlug();
    if (!conference) {
      return NextResponse.json({ ok: false, error: "Konferenca nuk u gjet", code: "CONF_NOT_FOUND" }, { status: 404 });
    }

    const existingRegistration = await getRegistrationByEmail(input.email, conference.id);

    let registration = existingRegistration;
    let token = registration?.qr_token;
    let createdNew = false;

    if (registration?.is_spam || registration?.archived) {
      return NextResponse.json(
        { ok: false, error: "Ky regjistrim është bllokuar. Ju lutemi kontaktoni organizatorët.", code: "BLOCKED" },
        { status: 403 }
      );
    }

    if (!registration) {
      ensureRegistrationIsOpen(conference);
      const registeredCount = await countRegistrations(conference.id);
      ensureCapacity(registeredCount, conference);

      const registrationId = randomUUID();
      const fee = calculateFee(conference, input.category);
      const participationType = "pasiv";
      const points = 12;

      const payload: RegistrationTokenPayload = {
        sub: registrationId,
        name: input.fullName,
        cat: input.category,
        conf: conference.slug,
        fee,
        cur: conference.currency
      };

      const { token: generatedToken, generated, publicKeyPem } = await signRegistrationToken(
        payload,
        QR_PRIVATE_KEY_PEM
      );

      if (!generatedToken) {
        throw new Error("QR token generation failed. This might be due to a missing or invalid QR_PRIVATE_KEY_PEM.");
      }

      if (generated && publicKeyPem) {
        console.warn("DEMO MODE: QR_PRIVATE_KEY_PEM missing. Generated temporary key pair.");
      }

      token = generatedToken;

      registration = await createRegistration({
        id: registrationId,
        conferenceId: conference.id,
        fullName: input.fullName.trim(),
        email: input.email,
        phone: input.phone,
        institution: input.institution,
        category: input.category,
        participationType,
        points,
        feeAmount: fee,
        currency: conference.currency,
        qrToken: generatedToken,
      });
      createdNew = true;
    }

    if (!registration) {
      return NextResponse.json({ ok: false, error: "Regjistrimi dështoi", code: "REG_FAIL" }, { status: 500 });
    }

    if (!createdNew) {
      // Duplicate registration: do not send email, just return existing info.
      return NextResponse.json({
        ok: true,
        status: "ALREADY_REGISTERED",
        registrationId: registration.id,
        message: "Jeni regjistruar tashmë. Përdorni butonin për të ridërguar email-in e konfirmimit.",
        code: "ALREADY_REGISTERED",
      });
    }

    const sendResult = await dispatchConfirmationEmail({
      registration,
      conference,
      type: "initial",
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "EMAIL_FAILED",
          error: sendResult.error ?? "Dërgimi i email-it (me PDF) dështoi.",
          registrationId: registration.id,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "CREATED",
      registrationId: registration.id,
      emailSent: true,
      code: "CREATED",
    });

  } catch (error) {
    console.error("[/api/register] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Të dhëna të pavlefshme", code: "INVALID_INPUT" }, { status: 400 });
    }

    const typedError = error as { message?: string; status?: number };
    if (typedError?.status === 429) {
      return NextResponse.json({ ok: false, error: typedError.message ?? "Shumë kërkesa", code: "RATE_LIMITED" }, { status: 429 });
    }

    let message = "Një gabim i papritur ndodhi. Ju lutemi provoni përsëri.";
    let code = "UNEXPECTED_ERROR";

    if (error instanceof Error) {
      if (error.message.includes("Missing required env vars")) {
        code = "SERVER_CONFIG_ERROR";
      } else if (error.message.includes("QR token generation failed")) {
        code = "QR_TOKEN_GENERATION_FAILED";
      } else if (error.message.includes("Failed to create registration")) {
        // This could be a unique constraint violation if the check above fails due to a race condition.
        code = "DB_INSERT_FAILED";
        if (error.message.includes("duplicate key value violates unique constraint")) {
          code = "ALREADY_REGISTERED";
          message = "Ky email tashmë është i regjistruar.";
        }
      } else if (error.message.includes("capacity")) {
        code = "CAPACITY_FULL";
        message = "Kapaciteti maksimal i pjesëmarrësve është arritur.";
      } else if (error.message.includes("closed")) {
        code = "REGISTRATION_CLOSED";
        message = "Regjistrimet janë mbyllur.";
      }
    }

    return NextResponse.json({ ok: false, error: message, code }, { status: code === 'ALREADY_REGISTERED' ? 409 : 500 });
  }
}
