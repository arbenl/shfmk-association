import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateFee, ensureCapacity, ensureRegistrationIsOpen } from "@/lib/fees";
import {
  countRegistrations,
  createRegistration,
  getConferenceBySlug,
  saveQrToken
} from "@/lib/supabase";
import { RegistrationTokenPayload, signRegistrationToken } from "@shfmk/shared";
import { QR_PRIVATE_KEY_PEM } from "@/lib/env";
import { createQrDataUrl } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";

const inputSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  institution: z.string().optional(),
  category: z.enum(["member", "non_member", "student"])
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = inputSchema.parse(body);

    const conference = await getConferenceBySlug();
    if (!conference) {
      return NextResponse.json({ error: "Conference not found" }, { status: 404 });
    }

    ensureRegistrationIsOpen(conference);

    const registeredCount = await countRegistrations(conference.id);
    ensureCapacity(registeredCount, conference);

    const fee = calculateFee(conference, input.category);
    const registration = await createRegistration({
      conferenceId: conference.id,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      institution: input.institution,
      category: input.category,
      feeAmount: fee,
      currency: conference.currency
    });

    const payload: RegistrationTokenPayload = {
      sub: registration.id,
      name: registration.full_name,
      cat: registration.category,
      conf: conference.slug,
      fee,
      cur: conference.currency
    };

    const { token, generated, publicKeyPem } = await signRegistrationToken(
      payload,
      QR_PRIVATE_KEY_PEM
    );
    const qrDataUrl = await createQrDataUrl(token);

    try {
      await saveQrToken(registration.id, token);
    } catch (error) {
      console.error("Failed to persist QR token", error);
    }

    let emailError: string | null = null;
    try {
      await sendConfirmationEmail({
        to: registration.email,
        fullName: registration.full_name,
        qrDataUrl,
        conferenceName: conference.name,
        category: registration.category,
        fee,
        currency: conference.currency
      });
    } catch (error) {
      console.error("Email send failed", error);
      emailError = (error as Error).message ?? "Failed to send email";
    }

    if (generated && publicKeyPem) {
      console.warn("DEMO MODE: QR_PRIVATE_KEY_PEM missing. Generated temporary key pair.");
      console.warn("Use this public key in the scanner:\n", publicKeyPem);
    }

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      token,
      qrDataUrl,
      emailError,
      demoPublicKey: generated ? publicKeyPem : undefined
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const message = (error as Error).message ?? "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
