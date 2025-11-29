import { SignJWT, jwtVerify } from 'jose';
import { ADMIN_SECRET, JWT_SECRET } from "./env";

const a = new TextEncoder();
const secretKey = a.encode(JWT_SECRET);
const cookieName = 'admin_session';

export async function createSessionCookie() {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin-user')
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
  
  // Return a serialized cookie string
  return `${cookieName}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`;
}

export async function verifySessionCookie(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (err) {
    throw new Error('Session cookie is invalid or expired.');
  }
}

export function clearSessionCookie() {
    return `${cookieName}=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function verifyAdminSecret(secret: string | null | undefined) {
  if (!ADMIN_SECRET) {
    throw new Error("ADMIN_SECRET is not configured.");
  }
  if (!secret || secret !== ADMIN_SECRET) {
    throw new Error("Unauthorized: Invalid secret provided.");
  }
}
