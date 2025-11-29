import { ADMIN_SECRET } from "./env";

export function verifyAdminSecret(secret: string | null | undefined) {
  if (!ADMIN_SECRET) {
    throw new Error("ADMIN_SECRET is not configured.");
  }
  if (!secret || secret !== ADMIN_SECRET) {
    throw new Error("Unauthorized");
  }
}
