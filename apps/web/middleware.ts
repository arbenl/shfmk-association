import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from './lib/adminAuth'; // I will create this utility

export const config = {
  // Protect all admin and admin API routes
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login API route to be accessed without a session
  if (pathname.startsWith('/api/admin/login')) {
    return NextResponse.next();
  }

  // 1. Try to get the session cookie
  const sessionCookie = req.cookies.get('admin_session')?.value;
  if (!sessionCookie) {
    return handleUnauthorized(req, 'Missing session cookie');
  }

  // 2. Verify the session cookie
  try {
    await verifySessionCookie(sessionCookie);
    // If verification is successful, allow the request to proceed
    return NextResponse.next();
  } catch (err) {
    return handleUnauthorized(req, 'Invalid session cookie');
  }
}

function handleUnauthorized(req: NextRequest, reason: string) {
  const { pathname } = req.nextUrl;
  console.warn(`Unauthorized access to ${pathname}: ${reason}`);

  // For API routes, return a 401 JSON response
  if (pathname.startsWith('/api/admin/')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // For browser navigation, redirect to the login page
  const loginUrl = new URL('/admin/login', req.url);
  // Pass the original destination so we can redirect back after login
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}
