import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle:
 * 1. URL redirects for backward compatibility (old /all-ads and /search URLs)
 * 2. Authentication for protected routes
 */
export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;

  // ===== URL REDIRECTS FOR BACKWARD COMPATIBILITY =====

  // Redirect /en/all-ads to /en/ads/nepal (or /en/ads with filters)
  if (pathname.match(/^\/[a-z]{2}\/all-ads$/)) {
    const lang = pathname.split('/')[1];

    // Check for old query parameters and convert to new URL structure
    const categorySlug = searchParams.get('category');
    const locationId = searchParams.get('location');
    const query = searchParams.get('query');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const sortBy = searchParams.get('sortBy');
    const page = searchParams.get('page');

    // Build new URL path segments
    const segments = [lang, 'ads'];

    // Note: We can't easily convert location ID to slug without a database call
    // For now, redirect to /ads with query params preserved
    // In production, you might want to add a database lookup here

    if (categorySlug) {
      segments.push(categorySlug);
    }

    // Build new query parameters (excluding category and location)
    const newQueryParams = new URLSearchParams();
    if (query) newQueryParams.set('query', query);
    if (minPrice) newQueryParams.set('minPrice', minPrice);
    if (maxPrice) newQueryParams.set('maxPrice', maxPrice);
    if (condition) newQueryParams.set('condition', condition);
    if (sortBy) newQueryParams.set('sortBy', sortBy);
    if (page) newQueryParams.set('page', page);

    const newPath = `/${segments.join('/')}`;
    const queryString = newQueryParams.toString();
    const newUrl = queryString ? `${newPath}?${queryString}` : newPath;

    console.log(`🔄 Redirecting: ${pathname} → ${newUrl}`);
    return NextResponse.redirect(new URL(newUrl, req.url));
  }

  // Redirect /en/search to /en/ads with search query
  if (pathname.match(/^\/[a-z]{2}\/search$/)) {
    const lang = pathname.split('/')[1];

    // Convert old search params to new URL structure
    const query = searchParams.get('q') || searchParams.get('query');
    const categorySlug = searchParams.get('category');
    const locationId = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const sortBy = searchParams.get('sortBy');
    const page = searchParams.get('page');

    // Build new URL path segments
    const segments = [lang, 'ads'];

    if (categorySlug) {
      segments.push(categorySlug);
    }

    // Build new query parameters
    const newQueryParams = new URLSearchParams();
    if (query) newQueryParams.set('query', query);
    if (minPrice) newQueryParams.set('minPrice', minPrice);
    if (maxPrice) newQueryParams.set('maxPrice', maxPrice);
    if (condition) newQueryParams.set('condition', condition);
    if (sortBy) newQueryParams.set('sortBy', sortBy);
    if (page) newQueryParams.set('page', page);

    const newPath = `/${segments.join('/')}`;
    const queryString = newQueryParams.toString();
    const newUrl = queryString ? `${newPath}?${queryString}` : newPath;

    console.log(`🔄 Redirecting: ${pathname} → ${newUrl}`);
    return NextResponse.redirect(new URL(newUrl, req.url));
  }

  // ===== AUTHENTICATION FOR PROTECTED ROUTES =====

  // For protected routes, use NextAuth middleware
  const protectedPaths = [
    '/dashboard',
    '/super-admin',
    '/editor',
    '/post-ad',
    '/edit-ad',
  ];

  const isProtectedRoute = protectedPaths.some(path => pathname.includes(path));

  if (isProtectedRoute) {
    // Extract language from pathname
    const langMatch = pathname.match(/^\/([a-z]{2})\//);
    const lang = langMatch ? langMatch[1] : 'en';

    // Use NextAuth withAuth middleware for protected routes
    return withAuth(
      function middleware(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        // Allow access to login pages without authentication
        if (pathname.includes('/login') || pathname.includes('/signin')) {
          return NextResponse.next();
        }

        // Super Admin routes
        if (pathname.includes('/super-admin')) {
          if (token?.role !== 'super_admin') {
            return NextResponse.redirect(new URL(`/${lang}/auth/signin`, req.url));
          }
        }

        // Editor routes
        if (pathname.includes('/editor')) {
          if (token?.role !== 'editor' && token?.role !== 'super_admin') {
            return NextResponse.redirect(new URL(`/${lang}/auth/signin`, req.url));
          }
        }

        // User dashboard routes
        if (pathname.includes('/dashboard') && !pathname.includes('/super-admin') && !pathname.includes('/editor')) {
          if (!token || token.role !== 'user') {
            return NextResponse.redirect(new URL(`/${lang}/auth/signin`, req.url));
          }
        }

        return NextResponse.next();
      },
      {
        callbacks: {
          authorized: ({ token, req }) => {
            // Allow access to login/signin pages without authentication
            if (req.nextUrl.pathname.includes('/login') || req.nextUrl.pathname.includes('/signin')) {
              return true;
            }
            // Require authentication for all other protected routes
            return !!token;
          },
        },
        pages: {
          signIn: `/${lang}/auth/signin`,
        },
      }
    )(req);
  }

  // Allow all other routes
  return NextResponse.next();
}

// Specify which routes this middleware applies to
export const config = {
  matcher: [
    // Protected routes
    '/en/dashboard/:path*',
    '/en/super-admin/:path*',
    '/en/editor/:path*',
    '/en/post-ad/:path*',
    '/en/edit-ad/:path*',
    // Redirect routes
    '/en/all-ads',
    '/en/search',
    '/:lang/all-ads',
    '/:lang/search',
  ],
};
