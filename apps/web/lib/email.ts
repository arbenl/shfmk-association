import { sendEmail } from "./email/resend";

export interface ConfirmationEmailInput {
  to: string;
  fullName: string;
  qrBuffer: Buffer; // Changed from qrDataUrl to qrBuffer
  conferenceName: string;
  conferenceLocation: string | null;
  conferenceStartDate: string | null;
  conferenceEndDate: string | null;
  category: string;
  participationType: string;
  points: number;
  fee: number;
  currency: string;
  verifyUrl?: string;
}

export async function sendConfirmationEmail(input: ConfirmationEmailInput) {
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
        <img src="cid:qr-code" alt="Kodi Juaj QR" style="width:220px;height:220px;border:1px solid #eee;padding:8px;border-radius:12px;" />
      </p>
      ${input.verifyUrl ? `<p style="text-align:center; font-size: 13px; color: #374151; margin-top: 8px;">
        Nëse imazhi nuk shfaqet, hapni këtë link: <a href="${input.verifyUrl}">${input.verifyUrl}</a>
      </p>` : ""}
      
      <h3 style="color: #2563eb; margin-top: 24px;">Detajet e Pagesës për Pjesëmarrje</h3>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 8px 0;"><strong>Banka:</strong> Pro Credit Bank</p>
        <p style="margin: 8px 0;"><strong>Nr. i llogarisë:</strong> 1110240460000163</p>
        <p style="margin: 8px 0;"><strong>Emri i llogarisë:</strong> KOSOVA FARMACEUTICAL SOCIETY</p>
        <p style="margin: 8px 0;"><strong>Adresa:</strong> Prishtinë</p>
        <p style="margin: 8px 0;"><strong>Përshkrimi:</strong> ${input.fullName}, pagesë për konferencë</p>
        <p style="margin: 8px 0;"><strong>Vlera për pagesë:</strong> ${input.fee}.00 ${input.currency}</p>
      </div>
      
      <p style="margin-top: 16px;"><strong>Kategoria:</strong> ${input.category === "farmacist" ? "Farmacist" : "Teknik i Farmacisë"}</p>
      <p style="margin-top: 4px;"><strong>Pjesëmarrja:</strong> ${input.participationType === "aktiv" ? "Pjesëmarrës aktiv" : "Pjesëmarrës pasiv"} (${input.points} pikë)</p>
      
      <p style="margin-top: 24px;">Nëse kodi QR nuk shfaqet, ju lutemi vizitoni faqen e suksesit të regjistrimit duke përdorur linkun që ju është dërguar.</p>
      <p style="margin-top: 12px; font-size:13px; color:#374151;">Pjesëmarrës pasiv (ndjekës): 12 pikë. Pjesëmarrës aktiv (vetëm ligjërues/prezentues): 15 pikë.</p>
      <p style="margin-top: 4px; font-size:12px; color:#6b7280;"><strong>Shënim:</strong> 15 pikë vlejnë vetëm për ligjëruesit/prezentuesit (jo për pjesëmarrësit e zakonshëm).</p>
      
      <p style="margin-top: 32px;">Me respekt,<br /><strong>Shoqata Farmaceutike e Kosovës</strong></p>
      <p style="font-size: 12px; color: #666; margin-top: 16px;">
        Kontakt: +383 44 629 856 | +383 49 595 475
      </p>
    </div>
  `;

  return sendEmail({
    to: input.to,
    subject,
    html,
    attachments: [
      {
        filename: "qr.png",
        content: input.qrBuffer,
        // CID for inline image rendering in clients (Gmail/Outlook)
        content_id: "qr-code",
        contentId: "qr-code",
        cid: "qr-code",
        disposition: "inline",
        contentType: "image/png",
      } as any,
    ],
  });
}
