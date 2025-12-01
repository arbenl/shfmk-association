import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sendEmail } from "./email/resend";

export interface ConfirmationEmailInput {
  to: string;
  fullName: string;
  registrationId: string;
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

function formatDate(date?: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("sq-AL", { dateStyle: "full" });
}

async function buildTicketPdf(input: ConfirmationEmailInput) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  let y = height - 72;

  const drawText = (text: string, size = 12, opts: { bold?: boolean; color?: any } = {}) => {
    const fontRef = font;
    const textWidth = fontRef.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: 48,
      y,
      size,
      font: fontRef,
      color: opts.color ?? rgb(0, 0, 0),
    });
    y -= size + 6;
    return textWidth;
  };

  page.drawText("Konferenca SHFK", { x: 48, y, size: 22, font, color: rgb(0, 0.2, 0.6) });
  y -= 30;
  page.drawText(input.conferenceName, { x: 48, y, size: 16, font });
  y -= 28;

  drawText(`Emri: ${input.fullName}`);
  drawText(
    `Kategoria: ${input.category === "farmacist" ? "Farmacist" : "Teknik i Farmacisë"}`
  );
  drawText(
    `Pjesëmarrja: ${
      input.participationType === "aktiv" ? "Pjesëmarrës aktiv" : "Pjesëmarrës pasiv"
    } (${input.points} pikë)`
  );
  drawText(`Pagesa: ${input.fee}.00 ${input.currency}`);
  drawText(`ID e regjistrimit: ${input.registrationId}`);

  const startDate = formatDate(input.conferenceStartDate);
  const endDate = formatDate(input.conferenceEndDate);
  if (startDate) {
    const dateText = endDate && startDate !== endDate ? `${startDate} - ${endDate}` : startDate;
    drawText(`Datat: ${dateText}`);
  }
  if (input.conferenceLocation) {
    drawText(`Lokacioni: ${input.conferenceLocation}`);
  }
  y -= 10;
  drawText("Instruksionet e pagesës:", 12, { bold: true });
  drawText("Banka: Pro Credit Bank");
  drawText("Nr. llogarisë: 1110240460000163");
  drawText("Emri i llogarisë: KOSOVA FARMACEUTICAL SOCIETY");
  drawText("Adresa: Prishtinë");
  drawText(`Përshkrimi: ${input.fullName}, pagesë për konferencë`);
  drawText(`Vlera: ${input.fee}.00 ${input.currency}`);

  y -= 14;
  drawText("Pikë për pjesëmarrje:", 12, { bold: true });
  drawText("Pjesëmarrës pasiv: 12 pikë");
  drawText("Pjesëmarrës aktiv (ligjërues/prezentues): 15 pikë");
  drawText("Shënim: 15 pikë vlejnë vetëm për ligjërues/prezentues.");

  y -= 18;
  drawText("Kodi juaj QR (brenda këtij dokumenti):", 12, { bold: true });

  // Center QR
  const qrImage = await pdfDoc.embedPng(input.qrBuffer);
  const qrDim = 200;
  page.drawImage(qrImage, {
    x: (width - qrDim) / 2,
    y: y - qrDim - 10,
    width: qrDim,
    height: qrDim,
  });
  y -= qrDim + 30;

  if (input.verifyUrl) {
    page.drawText(`Link verifikimi: ${input.verifyUrl}`, {
      x: 48,
      y,
      size: 10,
      font,
      color: rgb(0, 0.2, 0.6),
    });
    y -= 16;
  }

  page.drawText("Ky dokument është bileta juaj për hyrje.", { x: 48, y, size: 10, font });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
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

      <div style="background: #0f172a; color: #eef2ff; padding: 16px; border-radius: 12px; margin-top: 24px;">
        <h3 style="margin: 0 0 8px 0;">Kodi Juaj QR</h3>
        <p style="margin: 0;">Kodi QR është në PDF-in e bashkëngjitur. Ju lutemi hapni PDF-in, ruajeni dhe paraqiteni në hyrje.</p>
      </div>
      
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
      
      <p style="margin-top: 24px;">Nëse PDF-i nuk hapet, na kontaktoni për ridërgim.</p>
      <p style="margin-top: 12px; font-size:13px; color:#374151;">Pjesëmarrës pasiv (ndjekës): 12 pikë. Pjesëmarrës aktiv (vetëm ligjërues/prezentues): 15 pikë.</p>
      <p style="margin-top: 4px; font-size:12px; color:#6b7280;"><strong>Shënim:</strong> 15 pikë vlejnë vetëm për ligjëruesit/prezentuesit (jo për pjesëmarrësit e zakonshëm).</p>
      
      <p style="margin-top: 32px;">Me respekt,<br /><strong>Shoqata Farmaceutike e Kosovës</strong></p>
      <p style="font-size: 12px; color: #666; margin-top: 16px;">
        Kontakt: +383 44 629 856 | +383 49 595 475
      </p>
    </div>
  `;

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await buildTicketPdf(input);
  } catch (err) {
    console.error("[email] PDF generation failed", (err as Error).message);
    throw err;
  }

  return sendEmail({
    to: input.to,
    subject,
    html,
    attachments: pdfBuffer
      ? [
          {
            filename: "Bileta-Konference.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          } as any,
        ]
      : [],
  });
}
