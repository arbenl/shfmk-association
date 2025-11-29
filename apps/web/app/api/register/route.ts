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
import { createQrDataUrl } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";

// Schema for validating the request body
const inputSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  institution: z.string().optional(),
  category: z.enum(["member", "non_member", "student"])
});

export async function POST(req: NextRequest) {
  try {
    // 1. Validate environment and request body
    ensureServerEnv();
    const body = await req.json();
    const input = inputSchema.parse(body);

    // 2. Get conference details
    const conference = await getConferenceBySlug();
    if (!conference) {
      return NextResponse.json({ ok: false, error: "Konferenca nuk u gjet", code: "CONF_NOT_FOUND" }, { status: 404 });
    }

    // 3. Check for duplicates and registration status
    const existingRegistration = await getRegistrationByEmail(input.email, conference.id);
    if (existingRegistration) {
      try {
        // If the user is already registered, resend the confirmation email as a courtesy.
        const qrDataUrl = await createQrDataUrl(existingRegistration.qr_token);
        await sendConfirmationEmail({
          to: existingRegistration.email,
          fullName: existingRegistration.full_name,
          qrDataUrl,
          conferenceName: conference.name,
          conferenceLocation: conference.location,
          conferenceStartDate: conference.start_date,
          conferenceEndDate: conference.end_date,
          category: existingRegistration.category,
          fee: existingRegistration.fee_amount,
          currency: existingRegistration.currency
        });
        // On success, let the user know the email was resent.
        return NextResponse.json({ ok: true, message: "Ky email tashmë është i regjistruar. Sapo jua ridërguam email-in e konfirmimit.", code: "ALREADY_REGISTERED_RESENT" }, { status: 200 });
      } catch (emailError) {
        console.error("Failed to resend confirmation email on duplicate registration:", emailError);
        return NextResponse.json({ ok: false, error: "Email-i juaj është i regjistruar, por dërgimi i email-it të konfirmimit dështoi. Ju lutemi kontaktoni organizatorin.", code: "EMAIL_SEND_FAILED" }, { status: 500 });
      }
    }

    ensureRegistrationIsOpen(conference);
    const registeredCount = await countRegistrations(conference.id);
    ensureCapacity(registeredCount, conference);

    // 4. Pre-generate ID and QR token (THE FIX)
    const registrationId = randomUUID();
    const fee = calculateFee(conference, input.category);

    const payload: RegistrationTokenPayload = {
      sub: registrationId,
      name: input.fullName,
      cat: input.category,
      conf: conference.slug,
      fee,
      cur: conference.currency
    };

    // The signRegistrationToken function now becomes a critical part of the flow
    const { token, generated, publicKeyPem } = await signRegistrationToken(
      payload,
      QR_PRIVATE_KEY_PEM
    );

    // Guardrail: Ensure token was actually created
    if (!token) {
      throw new Error("QR token generation failed. This might be due to a missing or invalid QR_PRIVATE_KEY_PEM.");
    }
    
    if (generated && publicKeyPem) {
      console.warn("DEMO MODE: QR_PRIVATE_KEY_PEM missing. Generated temporary key pair.");
    }

    // 5. Create registration in a single DB call
    const registration = await createRegistration({
      id: registrationId,
      conferenceId: conference.id,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      institution: input.institution,
      category: input.category,
      feeAmount: fee,
      currency: conference.currency,
      qrToken: token, // Pass the generated token directly
    });

    // 6. Send confirmation email (best effort)
    const qrDataUrl = await createQrDataUrl(token);
    let emailSent = false;
    try {
      await sendConfirmationEmail({
        to: registration.email,
        fullName: registration.full_name,
        qrDataUrl,
        conferenceName: conference.name,
        conferenceLocation: conference.location,
        conferenceStartDate: conference.start_date,
        conferenceEndDate: conference.end_date,
        category: registration.category,
        fee,
        currency: conference.currency
      });
      emailSent = true;
    } catch (error) {
      // Log the error, but don't block the user. The UI will show a retry option.
      console.error("Email sending failed on initial registration:", error);
      emailSent = false;
    }

    // 7. Return success
    return NextResponse.json({
      ok: true,
      registrationId: registration.id,
      token,
      emailSent // Pass boolean instead of error string
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
