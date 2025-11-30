import { randomUUID } from "crypto";
import { Resend, type CreateEmailOptions } from "resend";
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from "@/lib/env";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  attachments?: CreateEmailOptions["attachments"];
};

type ProviderResponse = {
  id: string | null;
};

function assertResendConfig() {
  const missing: string[] = [];
  if (!RESEND_API_KEY || RESEND_API_KEY.trim().length < 10) {
    missing.push("RESEND_API_KEY");
  }
  if (!RESEND_FROM_EMAIL || !RESEND_FROM_EMAIL.includes("@")) {
    missing.push("RESEND_FROM_EMAIL");
  }

  if (missing.length > 0) {
    const message = `Email provider misconfigured: missing or invalid ${missing.join(
      ", "
    )}.`;
    console.error("[email][config][error]", { missing });
    throw new Error(message);
  }
}

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    assertResendConfig();
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendEmail(input: SendEmailInput): Promise<ProviderResponse> {
  const requestId = randomUUID();
  const toList = Array.isArray(input.to) ? input.to : [input.to];
  const logBase = {
    requestId,
    to: toList,
    from: RESEND_FROM_EMAIL,
    subject: input.subject,
  };

  console.info("[email][send][request]", logBase);

  const client = getResendClient();

  try {
    const { data, error } = await client.emails.send({
      from: RESEND_FROM_EMAIL,
      to: toList,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments,
    });

    if (error) {
      console.error("[email][send][error]", {
        ...logBase,
        error: { name: error.name, message: error.message },
      });
      throw new Error(`Resend error: ${error.message}`);
    }

    const response = { id: data?.id ?? null };
    console.info("[email][send][response]", { ...logBase, response });
    return response;
  } catch (err) {
    console.error("[email][send][exception]", {
      ...logBase,
      error: (err as Error).message,
    });
    throw err;
  }
}
