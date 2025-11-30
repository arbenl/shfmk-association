import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SECRET_KEY, RESEND_FROM_EMAIL } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key")?.trim();
  if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const to = body?.to as string | undefined;

  if (!to) {
    return NextResponse.json({ ok: false, error: "Body must include { to }" }, { status: 400 });
  }

  try {
    console.info("[admin][test-email][payload]", {
      to,
      from: RESEND_FROM_EMAIL,
      subject: "SHFK email test",
    });
    const response = await sendEmail({
      to,
      subject: "SHFK email test",
      html: `
        <div style="font-family: Arial, sans-serif; color: #111">
          <h2>SHFK Resend test email</h2>
          <p>If you received this, outbound email is configured for <strong>${RESEND_FROM_EMAIL}</strong>.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    return NextResponse.json({
      ok: true,
      providerId: response.id,
      from: RESEND_FROM_EMAIL,
    });
  } catch (error) {
    console.error("[admin][test-email][error]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send test email" },
      { status: 502 }
    );
  }
}
