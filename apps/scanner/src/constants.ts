import { generateInMemoryKeyPair } from "@shfmk/shared";

let cachedPublicKey: string | null = null;

export async function getPublicKeyPem(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;
  if (process.env.EXPO_PUBLIC_QR_PUBLIC_KEY_PEM) {
    cachedPublicKey = process.env.EXPO_PUBLIC_QR_PUBLIC_KEY_PEM;
    return cachedPublicKey;
  }

  const pair = await generateInMemoryKeyPair();
  cachedPublicKey = pair.publicKeyPem;
  console.warn("DEMO MODE: EXPO_PUBLIC_QR_PUBLIC_KEY_PEM missing. Generated temporary public key.");
  return cachedPublicKey;
}
