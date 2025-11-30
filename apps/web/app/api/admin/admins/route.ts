import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const emailSchema = z.string().email().transform((val) => val.trim().toLowerCase());

function normalizeEmail(email: string) {
  return emailSchema.parse(email);
}

async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ ok: false, error: "Jo i autentikuar" }, { status: 401 }) };
  }
  return { user };
}

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response!;

  const service = createServiceClient();
  const { data, error } = await service
    .from("admin_users")
    .select("email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "Gabim gjatë leximit" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, admins: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  const service = createServiceClient();

  let email: string;
  try {
    const body = await req.json();
    email = normalizeEmail(body.email);
  } catch {
    return NextResponse.json({ ok: false, error: "Email i pavlefshëm" }, { status: 400 });
  }

  const { error } = await service.from("admin_users").upsert({ email }, { onConflict: "email" });
  if (error) {
    return NextResponse.json({ ok: false, error: "Gabim gjatë shtimit" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}

export async function DELETE(req: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response!;

  const emailParam = req.nextUrl.searchParams.get("email");
  if (!emailParam) {
    return NextResponse.json({ ok: false, error: "Email mungon" }, { status: 400 });
  }

  let targetEmail: string;
  try {
    targetEmail = normalizeEmail(emailParam);
  } catch {
    return NextResponse.json({ ok: false, error: "Email i pavlefshëm" }, { status: 400 });
  }

  if (user.email && targetEmail === user.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Nuk mund ta fshish veten nga lista", code: "CANNOT_REMOVE_SELF" },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  const { data, error } = await service.from("admin_users").delete().eq("email", targetEmail).select("email").maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: "Gabim gjatë heqjes" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Email nuk u gjet" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
