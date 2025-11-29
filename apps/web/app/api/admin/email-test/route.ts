import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/adminAuth";
import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL, NODE_ENV } from "@/lib/env";

export async function GET(req: NextRequest) {
  // 1. Guard against public access
  const secret = req.headers.get("x-admin-secret");
  try {
    verifyAdminSecret(secret);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow in development to prevent accidental use in production
  if (NODE_ENV !== 'development') {
    return NextResponse.json({ error: "This endpoint is only available in development." }, { status: 403 });
  }

  const url = new URL(req.url);
  const toEmail = url.searchParams.get("to");

  if (!toEmail) {
    return NextResponse.json({ error: "Please provide a 'to' query parameter, e.g., ?to=your-email@example.com" }, { status: 400 });
  }

  // 2. Check for required env vars
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return NextResponse.json({ 
        error: "Server is missing RESEND_API_KEY or RESEND_FROM_EMAIL environment variables.",
        details: {
            hasApiKey: !!RESEND_API_KEY,
            hasFromEmail: !!RESEND_FROM_EMAIL
        }
    }, { status: 500 });
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    // 3. Send a test email
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: toEmail,
      subject: 'Test Email from SHFK App',
      html: '<h1>Success!</h1><p>If you received this, your email provider configuration is working correctly.</p>',
    });

    if (error) {
      // The provider itself returned an error (e.g., domain not verified)
      console.error("Resend API Error:", error);
      return NextResponse.json({ ok: false, error: "Resend API returned an error.", details: error }, { status: 502 });
    }

    // 4. Return success response
    return NextResponse.json({ ok: true, message: `Test email sent to ${toEmail}.`, providerId: data?.id });

  } catch (e) {
    // Catch-all for unexpected errors
    console.error("Email test endpoint error:", e);
    return NextResponse.json({ ok: false, error: "An unexpected error occurred.", details: (e as Error).message }, { status: 500 });
  }
}
