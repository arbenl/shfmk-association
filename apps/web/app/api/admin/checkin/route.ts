import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationToken, generateInMemoryKeyPair } from "@shfmk/shared";
import { createPublicKey } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SECRET_KEY, QR_PRIVATE_KEY_PEM, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "@/lib/env";
import { updateCheckInStatus } from "@/lib/supabase";

export interface CheckInPayload {
  registrationId: string;
  scannedAt: string;
}

async function getPublicKey() {
  if (QR_PRIVATE_KEY_PEM) {
    const publicKey = createPublicKey(QR_PRIVATE_KEY_PEM);
    return publicKey.export({ type: "spki", format: "pem" }) as string;
  }
  const pair = await generateInMemoryKeyPair();
  return pair.publicKeyPem;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-key")?.trim();
  if (!secret || secret !== ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  // Instant single check-in using QR token (preferred path)
  if (body && typeof body.token === "string") {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    try {
      const publicKey = await getPublicKey();
      const payload = await verifyRegistrationToken(body.token, publicKey);

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Atomic update: try to mark as checked in only if not already.
      const { data: updatedRows, error: updateAttemptError } = await supabase
        .from("registrations")
        .update({
          checked_in: true,
          checked_in_at: body.scannedAt || new Date().toISOString(),
        })
        .eq("id", payload.sub)
        .is("checked_in_at", null)
        .select("id, full_name, category, checked_in, checked_in_at, conference_id");

      if (updateAttemptError) {
        return NextResponse.json({ error: updateAttemptError.message }, { status: 400 });
      }

      const firstTimeRow = Array.isArray(updatedRows) && updatedRows.length > 0 ? updatedRows[0] : null;

      // If no row updated, fetch existing registration to return context and see if it exists.
      const { data: existingRegistration, error: fetchExistingError } = await supabase
        .from("registrations")
        .select("id, full_name, category, checked_in, checked_in_at, conference_id")
        .eq("id", payload.sub)
        .maybeSingle();

      if (fetchExistingError || !existingRegistration) {
        return NextResponse.json({ error: "Regjistrimi nuk u gjet" }, { status: 404 });
      }

      const effectiveRegistration = firstTimeRow ?? existingRegistration;
      const wasFirstCheckIn = Boolean(firstTimeRow);
      const alreadyCheckedIn = !wasFirstCheckIn;
      const checkedInAt = effectiveRegistration.checked_in_at ?? new Date().toISOString();
      const { data: conference } = await supabase
        .from("conferences")
        .select("name")
        .eq("id", effectiveRegistration.conference_id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        status: wasFirstCheckIn ? "checked_in" : "already_checked",
        alreadyCheckedIn,
        registrationId: effectiveRegistration.id,
        fullName: effectiveRegistration.full_name,
        category: effectiveRegistration.category,
        conferenceName: conference?.name ?? "",
        checkedInAt,
      });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: (error as Error).message ?? "Check-in dështoi" },
        { status: 400 }
      );
    }
  }

  // Bulk/offline sync fallback
  try {
    const checkIns = body as CheckInPayload[];
    if (!Array.isArray(checkIns) || checkIns.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. Expected token or an array of check-in records." },
        { status: 400 }
      );
    }

    const updatedCount = await updateCheckInStatus(checkIns);

    return NextResponse.json({ success: true, updated: updatedCount });
  } catch (error) {
    console.error("[/api/admin/checkin] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync check-ins." }, { status: 500 });
  }
}
