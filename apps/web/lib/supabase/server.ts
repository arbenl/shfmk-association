import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "@/lib/env";

// Session-aware client (uses anon key + cookies) — for auth flows and RLS-aware operations
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore when called from Server Components without a mutable cookie store.
        }
      },
    },
  });
}

// Service-role client (no cookies) — for server-only actions like admin allowlist checks
export function createServiceClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Route-scoped client that attaches set-cookie headers to the provided response
export function createRouteClient(req: NextRequest, response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            sameSite: options?.sameSite ?? "lax",
            secure: options?.secure ?? secure,
            path: options?.path ?? "/",
          });
        });
      },
    },
  });

  return { supabase, response };
}
