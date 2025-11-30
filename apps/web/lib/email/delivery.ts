import { createQrBuffer, buildVerifyUrl } from "@/lib/qr";
import { sendConfirmationEmail } from "@/lib/email";
import {
  Conference,
  RegistrationRow,
  createEmailOutboxEntry,
  updateEmailOutboxStatus,
  updateRegistrationEmailMeta,
} from "@/lib/supabase";

type DispatchType = "initial" | "admin_resend" | "self_resend";

export async function dispatchConfirmationEmail(params: {
  registration: RegistrationRow;
  conference: Conference;
  type: DispatchType;
}) {
  const { registration, conference, type } = params;

  // Outbox is best-effort so resend works even if migrations aren’t applied locally.
  let outbox: Awaited<ReturnType<typeof createEmailOutboxEntry>> | null = null;
  try {
    outbox = await createEmailOutboxEntry({
      registrationId: registration.id,
      type,
      status: "pending",
    });
  } catch (err) {
    console.warn("[dispatchConfirmationEmail] outbox insert skipped", {
      error: (err as Error).message,
    });
  }

  await updateRegistrationEmailMeta(registration.id, {
    status: "pending",
    lastError: null,
    incrementAttempts: false,
    incrementResend: type !== "initial",
  });

  try {
    const qrBuffer = await createQrBuffer(registration.qr_token);
    const provider = await sendConfirmationEmail({
      to: registration.email,
      fullName: registration.full_name,
      qrBuffer,
      conferenceName: conference.name,
      conferenceLocation: conference.location,
      conferenceStartDate: conference.start_date,
      conferenceEndDate: conference.end_date,
      category: registration.category,
      participationType: registration.participation_type,
      points: registration.points,
      fee: registration.fee_amount,
      currency: registration.currency,
      verifyUrl: buildVerifyUrl(registration.qr_token),
    });

    if (outbox) {
      await updateEmailOutboxStatus(outbox.id, {
        status: "sent",
        provider_id: provider?.id ?? null,
        attempts: outbox.attempts + 1,
      });
    }

    await updateRegistrationEmailMeta(registration.id, {
      status: "sent",
      lastError: null,
      markSent: true,
      incrementAttempts: true,
      incrementResend: type !== "initial",
    });

    return { success: true, providerId: provider?.id ?? null };
  } catch (err) {
    const errorMessage = (err as Error).message;

    if (outbox) {
      await updateEmailOutboxStatus(outbox.id, {
        status: "failed",
        last_error: errorMessage,
        attempts: outbox.attempts + 1,
      });
    }

    await updateRegistrationEmailMeta(registration.id, {
      status: "failed",
      lastError: errorMessage,
      incrementAttempts: true,
      incrementResend: type !== "initial",
    });

    return { success: false, error: errorMessage };
  }
}
