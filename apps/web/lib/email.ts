import { Resend } from "resend";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, SITE_BASE_URL } from "./env";

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export interface ConfirmationEmailInput {
  to: string;
  fullName: string;
  qrDataUrl: string;
  conferenceName: string;
  category: string;
  fee: number;
  currency: string;
}

export async function sendConfirmationEmail(input: ConfirmationEmailInput) {
  if (!resendClient) {
    throw new Error("Resend client missing. Set RESEND_API_KEY.");
  }
  if (!RESEND_FROM_EMAIL) {
    throw new Error("Missing RESEND_FROM_EMAIL.");
  }

  const subject = `Your SHFMK conference registration QR`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <p>Pershendetje ${input.fullName},</p>
      <p>Faleminderit për regjistrimin në <strong>${input.conferenceName}</strong>.</p>
      <p>Kategoria: <strong>${input.category}</strong> | Pagesa: <strong>${input.fee} ${input.currency}</strong></p>
      <p>Ky është QR-ja juaj (ruajeni si screenshot). Kontrollimi bëhet offline me çelës publik.</p>
      <p style="text-align:center;">
        <img src="${input.qrDataUrl}" alt="QR" style="width:220px;height:220px;border:1px solid #eee;padding:8px;border-radius:12px;" />
      </p>
      <p>Nëse QR nuk shfaqet, mund ta hapni nga faqja e suksesit: ${SITE_BASE_URL}/conference/register/success</p>
      <p>Respekte,<br />Shoqata Farmaceutike e Kosovës</p>
    </div>
  `;

  await resendClient.emails.send({
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    html
  });
}
