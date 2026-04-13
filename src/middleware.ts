import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lightweight auth check — just verify session cookie exists
  // Full auth validation happens in the API routes / server components
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  // For now, allow all access (no auth gating on demo)
  // Enable this block to require login:
  // if (!sessionToken) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/calculator/:path*', '/report/:path*', '/new/:path*'],
};
