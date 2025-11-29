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

  const subject = `Regjistrimi juaj për konferencën e SHFK`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <p>Përshëndetje ${input.fullName},</p>
      <p>Faleminderit për regjistrimin tuaj në konferencën <strong>"${input.conferenceName}"</strong>.</p>
      <p>Kategoria juaj e regjistrimit është: <strong>${input.category}</strong>. Kostoja e pjesëmarrjes është <strong>${input.fee} ${input.currency}</strong>.</p>
      <p>Më poshtë gjeni kodin tuaj QR. Ju lutemi ruajeni këtë kod (p.sh. si screenshot), pasi që do të përdoret për identifikimin tuaj në hyrje të konferencës. Skanimi i kodit bëhet pa pasur nevojë për internet.</p>
      <p style="text-align:center;">
        <img src="${input.qrDataUrl}" alt="Kodi QR" style="width:220px;height:220px;border:1px solid #eee;padding:8px;border-radius:12px;" />
      </p>
      <p>Nëse kodi QR nuk shfaqet, ju lutemi vizitoni <a href="${SITE_BASE_URL}/conference/register/success?token=${input.qrDataUrl}">faqen e suksesit të regjistrimit</a>.</p>
      <p>Me respekt,<br />Shoqata Farmaceutike e Kosovës</p>
    </div>
  `;

  await resendClient.emails.send({
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    html
  });
}
