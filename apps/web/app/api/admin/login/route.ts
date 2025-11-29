import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret, createSessionCookie } from "@/lib/adminAuth";
import { ensureServerEnv } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    ensureServerEnv();
    const body = await req.json();
    const { secret } = body;

    // 1. Verify the provided secret against the one in the environment
    verifyAdminSecret(secret);

    // 2. If successful, create a session cookie
    const sessionCookie = await createSessionCookie();

    // 3. Return a success response with the Set-Cookie header
    const headers = { 'Set-Cookie': sessionCookie };
    return NextResponse.json({ ok: true, message: "Login successful" }, { headers });

  } catch (error) {
    console.error("[/api/admin/login] Error:", error);
    return NextResponse.json({ ok: false, error: "Invalid secret or server error." }, { status: 401 });
  }
}
