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
import { QR_PRIVATE_KEY_PEM, ensureServerEnv } from "@/lib/env";
import { dispatchConfirmationEmail } from "@/lib/email/delivery";
import { isSuspiciousRegistration } from "@/lib/registrationSpamCheck";

// Schema for validating the request body
const inputSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  institution: z.string().optional(),
  category: z.enum(["farmacist", "teknik"]),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Validate environment and request body (allow registration even if email env missing)
    ensureServerEnv({ requireEmailEnv: false });
    const body = await req.json();
    const input = inputSchema.parse(body);

    // 2. Get conference details
    const conference = await getConferenceBySlug();
    if (!conference) {
      return NextResponse.json({ ok: false, error: "Konferenca nuk u gjet", code: "CONF_NOT_FOUND" }, { status: 404 });
    }

    const existingRegistration = await getRegistrationByEmail(input.email, conference.id);

    let registration = existingRegistration;
    let token = registration?.qr_token;
    let createdNew = false;

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

      const isSpam = isSuspiciousRegistration({
        full_name: input.fullName,
        institution: input.institution,
        email: input.email,
        phone: input.phone,
      });

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
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        institution: input.institution,
        category: input.category,
        participationType,
        points,
        feeAmount: fee,
        currency: conference.currency,
        qrToken: generatedToken,
        isSpam,
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

    if (!registration.is_spam) {
      const sendResult = await dispatchConfirmationEmail({
        registration,
        conference,
        type: "initial",
      });

      if (!sendResult.success) {
        // Registration succeeded but email failed (e.g., provider compliance block). Surface success with warning.
        return NextResponse.json({
          ok: true,
          status: "EMAIL_FAILED",
          registrationId: registration.id,
          emailSent: false,
          code: "EMAIL_FAILED",
          message:
            sendResult.error ??
            "Regjistrimi u krye, por dërgimi i email-it dështoi. Ju lutemi provoni përsëri ridërgimin.",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      status: "CREATED",
      registrationId: registration.id,
      emailSent: !registration.is_spam,
      code: "CREATED",
    });

  } catch (error) {
    console.error("[/api/register] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Të dhëna të pavlefshme", code: "INVALID_INPUT" }, { status: 400 });
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
