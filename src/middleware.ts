import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth';

const AUTH_PAGES = ['/login'];
const ADMIN_PAGES = ['/users', '/monitoring'];

const isAuthPage = (url: string) => AUTH_PAGES.some((page) => url.startsWith(page));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const decodedToken = token ? await verifyJwt(token) : null;
  const userRole = decodedToken?.role;

  const isRequestedAuthPage = isAuthPage(pathname);

  if (isRequestedAuthPage) {
    if (decodedToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!decodedToken) {
    const searchParams = new URLSearchParams();
    if (pathname !== '/') {
        searchParams.set('next', pathname);
    }
    const url = new URL('/login', request.url);
    url.search = searchParams.toString();
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (ADMIN_PAGES.some(page => pathname.startsWith(page))) {
    if (userRole !== 'SUPER_ADMIN') {
      // Redirect to a 'not authorized' page or dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/users/:path*',
    '/monitoring/:path*',
    '/folders/:path*',
    '/profile/:path*',
    '/login',
  ],
};
