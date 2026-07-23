import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('td_session');

  // Protected routes list
  const protectedRoutes = ['/tasks', '/tasks/new', '/profile'];
  const isProtected = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl, 302);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/tasks', '/tasks/:path*', '/profile'],
};
