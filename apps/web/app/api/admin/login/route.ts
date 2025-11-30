import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_DEBUG } from "@/lib/env";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email dhe fjalëkalimi kërkohen" }, { status: 400 });
  }

  const nextResponse = NextResponse.json({ ok: true }); // placeholder to collect cookies
  const { supabase, response } = createRouteClient(req, nextResponse);
  const service = createServiceClient();

  // 1) Authenticate
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    if (ADMIN_AUTH_DEBUG) console.error("[admin login] invalid credentials", authError?.message);
    return NextResponse.json(
      { ok: false, error: "Email/Fjalëkalimi i pasaktë", code: "INVALID_CREDENTIALS" },
      { status: 401 }
    );
  }

  // 2) Authorize (allowlist)
  const { data: allowedUser, error: allowError } = await service
    .from("admin_users")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (allowError) {
    if (ADMIN_AUTH_DEBUG) console.error("[admin login] allowlist error", allowError.message);
    return NextResponse.json(
      { ok: false, error: "Gabim gjatë verifikimit të aksesit", code: "ALLOWLIST_ERROR" },
      { status: 500 }
    );
  }

  if (!allowedUser) {
    if (ADMIN_AUTH_DEBUG) console.error("[admin login] not authorized", email.toLowerCase());
    return NextResponse.json(
      { ok: false, error: "Nuk keni autorizim", code: "NOT_AUTHORIZED" },
      { status: 403 }
    );
  }

  // success: return response with cookies attached
  return NextResponse.json({ ok: true }, { headers: response.headers });
}
