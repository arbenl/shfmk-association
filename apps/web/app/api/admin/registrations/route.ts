import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/adminAuth";
import { CONFERENCE_SLUG } from "@/lib/env";
import { getConferenceBySlug, listRegistrations } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("q") ?? undefined;
  const slug = url.searchParams.get("conf") ?? CONFERENCE_SLUG;
  const format = url.searchParams.get("format") ?? "json";

  const conference = await getConferenceBySlug(slug);
  if (!conference) {
    return NextResponse.json({ error: "Conference not found" }, { status: 404 });
  }

  const registrations = await listRegistrations({
    conferenceId: conference.id,
    search
  });

  if (format === "csv") {
    const csv = toCsv(registrations as unknown as Record<string, unknown>[]);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=\"registrations.csv\""
      }
    });
  }

  return NextResponse.json({ registrations, conference });
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))
  ];
  return lines.join("\n");
}
