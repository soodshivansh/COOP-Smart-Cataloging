import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Public routes
  const publicRoutes = ['/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!req.auth && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
