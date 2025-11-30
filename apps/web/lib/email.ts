import PDFDocument from "pdfkit";
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

function formatDate(date?: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("sq-AL", { dateStyle: "full" });
}

async function buildTicketPdf(input: ConfirmationEmailInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Konferenca SHFK", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text(input.conferenceName, { align: "center" });
    doc.moveDown(1.2);

    doc.fontSize(12).text(`Emri: ${input.fullName}`);
    doc.text(
      `Kategoria: ${
        input.category === "farmacist" ? "Farmacist" : "Teknik i Farmacisë"
      }`
    );
    doc.text(
      `Pjesëmarrja: ${
        input.participationType === "aktiv"
          ? "Pjesëmarrës aktiv"
          : "Pjesëmarrës pasiv"
      } (${input.points} pikë)`
    );

    const startDate = formatDate(input.conferenceStartDate);
    const endDate = formatDate(input.conferenceEndDate);
    if (startDate) {
      const dateText =
        endDate && startDate !== endDate
          ? `${startDate} - ${endDate}`
          : startDate;
      doc.text(`Datat: ${dateText}`);
    }
    if (input.conferenceLocation) {
      doc.text(`Lokacioni: ${input.conferenceLocation}`);
    }
    doc.moveDown();

    doc.text("Instruksionet e pagesës:", { underline: true });
    doc.text("Banka: Pro Credit Bank");
    doc.text("Nr. llogarisë: 1110240460000163");
    doc.text("Emri i llogarisë: KOSOVA FARMACEUTICAL SOCIETY");
    doc.text("Adresa: Prishtinë");
    doc.text(`Përshkrimi: ${input.fullName}, pagesë për konferencë`);
    doc.text(`Vlera: ${input.fee}.00 ${input.currency}`);
    doc.moveDown(1.2);

    doc.text("Kodi juaj QR:", { underline: true });
    doc.moveDown(0.5);
    doc.image(input.qrBuffer, {
      fit: [220, 220],
      align: "center",
      valign: "center",
    });
    if (input.verifyUrl) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#2563eb").text(input.verifyUrl, {
        align: "center",
        link: input.verifyUrl,
      });
      doc.fillColor("black");
    }

    doc.end();
  });
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
        <p style="margin: 0 0 12px 0;">Skanojeni në hyrje. Ruajeni (screenshot ose PDF i bashkëngjitur).</p>
        <div style="text-align:center; margin: 12px 0;">
          <img src="cid:qr-code" alt="Kodi Juaj QR" style="width:240px;height:240px;border:1px solid #1e293b;padding:8px;border-radius:12px;background:#fff;" />
        </div>
        ${
          input.verifyUrl
            ? `<p style="margin: 0; font-size: 13px; color: #cbd5e1;">
        Link verifikimi: <a href="${input.verifyUrl}" style="color:#bfdbfe;">${input.verifyUrl}</a>
        </p>`
            : ""
        }
        <p style="margin: 8px 0 0 0; font-size: 13px;">Gjendet edhe në PDF-in e bashkëngjitur.</p>
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
      
      <p style="margin-top: 24px;">Nëse kodi QR nuk shfaqet, ju lutemi vizitoni faqen e suksesit të regjistrimit duke përdorur linkun që ju është dërguar.</p>
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
    console.warn("[email] PDF generation failed; sending without PDF", (err as Error).message);
    pdfBuffer = null;
  }

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
      ...(pdfBuffer
        ? [
            {
              filename: "Bileta-Konference.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            } as any,
          ]
        : []),
    ],
  });
}
