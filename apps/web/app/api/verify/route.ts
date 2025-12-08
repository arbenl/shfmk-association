import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationToken, generateInMemoryKeyPair } from "@shfmk/shared";
import { createPublicKey } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_KEY, SUPABASE_URL, QR_PRIVATE_KEY_PEM } from "@/lib/env";

async function getPublicKey() {
  if (QR_PRIVATE_KEY_PEM) {
    const publicKey = createPublicKey(QR_PRIVATE_KEY_PEM);
    return publicKey.export({ type: "spki", format: "pem" }) as string;
  }
  const pair = await generateInMemoryKeyPair();
  return pair.publicKeyPem;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  return handleVerify(token ?? undefined);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token as string | undefined;
  return handleVerify(token);
}

async function handleVerify(token?: string) {
  if (!token) {
    return NextResponse.json({ ok: false, error: "Token mungon" }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const publicKey = await getPublicKey();
    const payload = await verifyRegistrationToken(token, publicKey);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("id, full_name, category, checked_in, checked_in_at")
      .eq("id", payload.sub)
      .eq("is_spam", false)
      .eq("archived", false)
      .maybeSingle();

    if (fetchError || !registration) {
      return NextResponse.json(
        { ok: false, error: "Regjistrimi nuk u gjet", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      registrationId: registration.id,
      fullName: registration.full_name,
      category: registration.category,
      alreadyCheckedIn: registration.checked_in,
      checkedInAt: registration.checked_in_at,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message, code: "INVALID_TOKEN" },
      { status: 400 }
    );
  }
}
