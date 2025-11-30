import QRCode from "qrcode";

export async function createQrDataUrl(token: string) {
  return QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 2 });
}

export async function createQrBuffer(token: string) {
  return QRCode.toBuffer(token, { errorCorrectionLevel: "M", margin: 2 });
}
