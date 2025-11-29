import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/adminAuth";

export async function POST() {
  // Always clear the cookie, regardless of whether it exists or not.
  const headers = { 'Set-Cookie': clearSessionCookie() };
  return NextResponse.json({ ok: true, message: "Logged out" }, { headers });
}
