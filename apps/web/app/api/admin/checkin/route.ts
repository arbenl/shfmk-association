import { NextRequest, NextResponse } from "next/server";
import { updateCheckInStatus } from "@/lib/supabase";
import { ADMIN_SECRET_KEY } from "@/lib/env";

export interface CheckInPayload {
  registrationId: string;
  scannedAt: string;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-key")?.trim();
  if (!secret || secret !== ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const checkIns = (await req.json()) as CheckInPayload[];
    if (!Array.isArray(checkIns) || checkIns.length === 0) {
      return NextResponse.json({ error: "Invalid payload. Expected an array of check-in records." }, { status: 400 });
    }

    const updatedCount = await updateCheckInStatus(checkIns);

    return NextResponse.json({ success: true, updated: updatedCount });
  } catch (error) {
    console.error("[/api/admin/checkin] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync check-ins." }, { status: 500 });
  }
}
