import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Allow access to login pages without authentication
    if (pathname.includes('/login')) {
      return NextResponse.next();
    }

    // Super Admin routes
    if (pathname.includes('/super-admin')) {
      if (token?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/en/auth/login', req.url));
      }
    }

    // Editor routes
    if (pathname.includes('/editor')) {
      if (token?.role !== 'editor' && token?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/en/auth/login', req.url));
      }
    }

    // User dashboard routes
    if (pathname.includes('/dashboard') && !pathname.includes('/super-admin') && !pathname.includes('/editor')) {
      if (!token || token.role !== 'user') {
        return NextResponse.redirect(new URL('/en/auth/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login pages without authentication
        if (req.nextUrl.pathname.includes('/login')) {
          return true;
        }
        // Require authentication for all other protected routes
        return !!token;
      },
    },
  }
);

// Specify which routes to protect
export const config = {
  matcher: [
    '/en/dashboard/:path*',
    '/en/super-admin/:path*',
    '/en/editor/:path*',
    '/en/post-ad/:path*',
  ],
};
