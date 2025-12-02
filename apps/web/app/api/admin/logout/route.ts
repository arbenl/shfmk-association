import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const nextResponse = NextResponse.json({ ok: true });
  const { supabase, response } = createRouteClient(req, nextResponse);

  await supabase.auth.signOut();

  const redirectUrl = new URL("/admin/login?signedOut=1", req.url);
  return NextResponse.redirect(redirectUrl, { headers: response.headers });
}
