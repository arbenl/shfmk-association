import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ ok: false, error: "Jo i autentikuar" }, { status: 401 }) };
  }

  const service = createServiceClient();
  const { data: allowed } = await service
    .from("admin_users")
    .select("email")
    .eq("email", user.email?.toLowerCase() ?? "")
    .maybeSingle();

  if (!allowed) {
    return { response: NextResponse.json({ ok: false, error: "Nuk keni autorizim" }, { status: 403 }) };
  }

  return { service };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if ("response" in admin) return admin.response;

  const { action, reason } = await req.json().catch(() => ({ action: null, reason: null }));
  const registrationId = params.id;

  const service = admin.service;

  if (!registrationId || !action) {
    return NextResponse.json({ ok: false, error: "Kërkesë e pavlefshme" }, { status: 400 });
  }

  if (action === "delete") {
    const { error } = await service.from("registrations").delete().eq("id", registrationId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, deleted: true });
  }

  const updates: Record<string, unknown> = {};
  if (action === "mark_spam") {
    updates.is_spam = true;
    updates.archived = false;
    updates.spam_reason = reason ?? null;
  } else if (action === "unspam") {
    updates.is_spam = false;
    updates.spam_reason = null;
  } else if (action === "archive") {
    updates.archived = true;
  } else if (action === "restore") {
    updates.archived = false;
  } else {
    return NextResponse.json({ ok: false, error: "Veprim i pavlefshëm" }, { status: 400 });
  }

  const { data, error } = await service
    .from("registrations")
    .update(updates)
    .eq("id", registrationId)
    .select("id, is_spam, archived, spam_reason")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "Regjistrimi nuk u gjet" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, registration: data });
}
