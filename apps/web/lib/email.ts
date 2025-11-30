import { Resend } from "resend";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, SITE_BASE_URL, NODE_ENV } from "./env";

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export interface ConfirmationEmailInput {
  to: string;
  fullName: string;
  qrBuffer: Buffer; // Changed from qrDataUrl to qrBuffer
  conferenceName: string;
  conferenceLocation: string | null;
  conferenceStartDate: string | null;
  conferenceEndDate: string | null;
  category: string;
  fee: number;
  currency: string;
}

export async function sendConfirmationEmail(input: ConfirmationEmailInput) {
  // Check if Resend client is configured
  if (!resendClient) {
    const errorMsg = "RESEND_API_KEY is not configured. Cannot send confirmation email.";
    console.error(`[sendConfirmationEmail] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Validate FROM email address
  if (!RESEND_FROM_EMAIL) {
    const errorMsg = "RESEND_FROM_EMAIL is not configured. Cannot send confirmation email.";
    console.error(`[sendConfirmationEmail] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const subject = `Regjistrimi juaj për konferencën e SHFK`;

  let conferenceDetails = "";
  if (input.conferenceLocation && input.conferenceStartDate) {
    const startDate = new Date(input.conferenceStartDate).toLocaleDateString('sq-AL', { dateStyle: 'full' });
    const endDate = input.conferenceEndDate ? new Date(input.conferenceEndDate).toLocaleDateString('sq-AL', { dateStyle: 'full' }) : null;
    const dateText = endDate && startDate !== endDate ? ` mbahet prej ${startDate} deri më ${endDate}` : ` mbahet më ${startDate}`;
    conferenceDetails = `<p>Konferenca ${dateText} në <strong>${input.conferenceLocation}</strong>.</p>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto;">
      <p>Përshëndetje ${input.fullName},</p>
      <p>Faleminderit për regjistrimin tuaj në konferencën <strong>"${input.conferenceName}"</strong>.</p>
      ${conferenceDetails}
      
      <h3 style="color: #2563eb; margin-top: 24px;">Kodi Juaj QR</h3>
      <p>Më poshtë gjeni kodin tuaj QR. Ju lutemi ruajeni këtë kod (p.sh. si screenshot), pasi që do të përdoret për identifikimin tuaj në hyrje të konferencës. Skanimi i kodit bëhet pa pasur nevojë për internet.</p>
      <p style="text-align:center; margin: 20px 0;">
        <img src="cid:qr-code" alt="Kodi QR" style="width:220px;height:220px;border:1px solid #eee;padding:8px;border-radius:12px;" />
      </p>
      
      <h3 style="color: #2563eb; margin-top: 24px;">Detajet e Pagesës për Pjesëmarrje</h3>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 8px 0;"><strong>Banka:</strong> Pro Credit Bank</p>
        <p style="margin: 8px 0;"><strong>Nr. i llogarisë:</strong> 1110240460000163</p>
        <p style="margin: 8px 0;"><strong>Emri i llogarisë:</strong> KOSOVA FARMACEUTICAL SOCIETY</p>
        <p style="margin: 8px 0;"><strong>Adresa:</strong> Prishtinë</p>
        <p style="margin: 8px 0;"><strong>Përshkrimi:</strong> ${input.fullName}, pagesë për konferencë</p>
        <p style="margin: 8px 0;"><strong>Vlera për pagesë:</strong> ${input.fee}.00 ${input.currency}</p>
      </div>
      
      <p style="margin-top: 20px;"><strong>Kategoria juaj e regjistrimit:</strong> ${input.category}</p>
      
      <p style="margin-top: 24px;">Nëse kodi QR nuk shfaqet, ju lutemi vizitoni faqen e suksesit të regjistrimit duke përdorur linkun që ju është dërguar.</p>
      
      <p style="margin-top: 32px;">Me respekt,<br /><strong>Shoqata Farmaceutike e Kosovës</strong></p>
      <p style="font-size: 12px; color: #666; margin-top: 16px;">
        Kontakt: +383 44 629 856 | +383 49 595 475
      </p>
    </div>
  `;

  console.log(`[sendConfirmationEmail] Attempting to send email to: ${input.to}`);
  console.log(`[sendConfirmationEmail] From: ${RESEND_FROM_EMAIL}`);
  console.log(`[sendConfirmationEmail] Subject: ${subject}`);

  try {
    const { data, error } = await resendClient.emails.send({
      from: `Shoqata Farmaceutike e Kosovës <${RESEND_FROM_EMAIL}>`,
      to: input.to,
      subject,
      html,
      attachments: [
        {
          filename: 'qrcode.png',
          content: input.qrBuffer,
          content_id: 'qr-code',
        } as any,
      ],
    });

    if (error) {
      console.error(`[sendConfirmationEmail] Resend API error:`, error);
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log(`[sendConfirmationEmail] ✅ Email sent successfully to ${input.to}. Provider ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error(`[sendConfirmationEmail] ❌ Email send failed for ${input.to}:`, error);
    throw new Error(`Email send failed: ${(error as Error).message}`);
  }
}