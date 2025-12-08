type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

function now() {
  return Date.now();
}

function touch(key: string, limit: number, windowMs: number): boolean {
  const current = store.get(key);
  const ts = now();

  if (!current || current.resetAt <= ts) {
    store.set(key, { count: 1, resetAt: ts + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

/**
 * Naive in-memory rate limiter (best-effort for serverless). Limits by IP and email.
 */
export function enforceRegistrationRateLimit(ip: string | null, email: string) {
  const normalizedIp = ip ?? "unknown";
  const normalizedEmail = email.toLowerCase();

  const ipOk = touch(`ip:${normalizedIp}`, 5, 10 * 60 * 1000); // 5 every 10 minutes
  const emailOk = touch(`email:${normalizedEmail}`, 3, 60 * 60 * 1000); // 3 every hour

  if (!ipOk) {
    const err = new Error("Shumë kërkesa nga kjo IP. Provoni më vonë.");
    (err as any).status = 429;
    throw err;
  }

  if (!emailOk) {
    const err = new Error("Shumë tentativa për këtë email. Provoni pas pak.");
    (err as any).status = 429;
    throw err;
  }
}
