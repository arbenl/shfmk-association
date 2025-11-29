import {
  exportPKCS8,
  exportSPKI,
  generateKeyPair,
  importPKCS8,
  importSPKI,
  jwtVerify,
  SignJWT,
  type KeyLike
} from "jose";

export type RegistrationCategory = "member" | "non_member" | "student";

export interface RegistrationTokenPayload {
  sub: string;
  name: string;
  cat: RegistrationCategory;
  conf: string;
  fee: number;
  cur: string;
  iat?: number;
}

export interface LoadedPrivateKey {
  key: unknown;
  generated: boolean;
  privateKeyPem?: string;
  publicKeyPem?: string;
}

export interface LoadedPublicKey {
  key: unknown;
  generated: boolean;
  publicKeyPem?: string;
}

export async function signRegistrationToken(
  payload: RegistrationTokenPayload,
  privateKeyPem?: string
): Promise<{ token: string; generated: boolean; publicKeyPem?: string }> {
  const { key, generated, publicKeyPem } = await loadPrivateKey(privateKeyPem);
  const issuedAt = payload.iat ?? Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    name: payload.name,
    cat: payload.cat,
    conf: payload.conf,
    fee: payload.fee,
    cur: payload.cur
  })
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(payload.sub)
    .setIssuedAt(issuedAt)
    .sign(key as never);

  return { token, generated, publicKeyPem };
}

export async function verifyRegistrationToken(
  token: string,
  publicKeyPem: string
): Promise<RegistrationTokenPayload> {
  const { key } = await loadPublicKey(publicKeyPem);
  const { payload } = await jwtVerify(token, key as never, {
    algorithms: ["RS256"]
  });

  return {
    sub: payload.sub ?? "",
    name: payload.name as string,
    cat: payload.cat as RegistrationCategory,
    conf: payload.conf as string,
    fee: Number(payload.fee),
    cur: payload.cur as string,
    iat: payload.iat
  };
}

export async function loadPrivateKey(privateKeyPem?: string): Promise<LoadedPrivateKey> {
  if (privateKeyPem) {
    const key = await importPKCS8(privateKeyPem, "RS256");
    return { key, generated: false };
  }

  const generatedPair = await generateInMemoryKeyPair();
  return {
    key: generatedPair.privateKey,
    generated: true,
    privateKeyPem: generatedPair.privateKeyPem,
    publicKeyPem: generatedPair.publicKeyPem
  };
}

export async function loadPublicKey(publicKeyPem: string): Promise<LoadedPublicKey> {
  const key = await importSPKI(publicKeyPem, "RS256");
  return { key, generated: false, publicKeyPem };
}

export async function generateInMemoryKeyPair(): Promise<{
  privateKey: KeyLike;
  publicKey: KeyLike;
  privateKeyPem: string;
  publicKeyPem: string;
}> {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const privateKeyPem = await exportPKCS8(privateKey);
  const publicKeyPem = await exportSPKI(publicKey);

  return { privateKey, publicKey, privateKeyPem, publicKeyPem };
}
