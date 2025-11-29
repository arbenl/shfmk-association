import QRCode from "qrcode";

export async function createQrDataUrl(token: string) {
  return QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 2 });
}
