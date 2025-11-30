import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_AUTH_DEBUG } from '@/lib/env';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Allow login page and API to pass through
  if (pathname.startsWith('/api/admin/login') || pathname === '/admin/login') {
    return response;
  }

  // Check auth for protected admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (ADMIN_AUTH_DEBUG) console.warn("[middleware] no session, redirecting", pathname);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check allowlist
    const service = createServiceClient();
    const { data: allowedUser, error: allowErr } = await service
      .from('admin_users')
      .select('email')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (allowErr && ADMIN_AUTH_DEBUG) console.error("[middleware] allowlist error", allowErr.message);

    if (!allowedUser) {
      // User is logged in but not an admin
      // We can redirect to a "Unauthorized" page or just return 403
      // For now, let's redirect to login with an error
      if (ADMIN_AUTH_DEBUG) console.warn("[middleware] user not in allowlist", user.email);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'Unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/((?!login|checkin|email-test).*)'
  ],
};
