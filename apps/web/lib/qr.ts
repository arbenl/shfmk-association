import QRCode from "qrcode";
import { SITE_BASE_URL } from "./env";

function getBaseUrl() {
  // Always prefer explicit public base URLs; otherwise fall back to SITE_BASE_URL, then localhost.
  return process.env.NEXT_PUBLIC_BASE_URL ?? SITE_BASE_URL ?? "http://localhost:3000";
}

export function buildVerifyUrl(token: string) {
  return `${getBaseUrl()}/verify?token=${encodeURIComponent(token)}`;
}

export async function createQrDataUrl(token: string) {
  const url = buildVerifyUrl(token);
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2 });
}

export async function createQrBuffer(token: string) {
  const url = buildVerifyUrl(token);
  return QRCode.toBuffer(url, { errorCorrectionLevel: "M", margin: 2 });
}
