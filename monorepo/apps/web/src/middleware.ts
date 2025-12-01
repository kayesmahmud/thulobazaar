import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle:
 * 1. URL redirects for backward compatibility (old /all-ads and /search URLs)
 * 2. Authentication for protected routes
 */
export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;

  // ===== URL REDIRECTS FOR BACKWARD COMPATIBILITY =====

  // Redirect /en/all-ads to /en/ads/nepal (or /en/ads with filters)
  if (pathname.match(/^\/[a-z]{2}\/all-ads$/)) {
    const lang = pathname.split('/')[1];

    // Check for old query parameters and convert to new URL structure
    const categorySlug = searchParams.get('category');
    const query = searchParams.get('query');
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

  // ===== AUTHENTICATION FOR PROTECTED ROUTES =====

  // Extract language from pathname
  const langMatch = pathname.match(/^\/([a-z]{2})\//);
  const lang = langMatch ? langMatch[1] : 'en';

  // Get the JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/post-ad', '/edit-ad'];
  const isProtectedRoute = protectedPaths.some(path => pathname.includes(path));

  // Staff routes that require specific roles
  const superAdminPaths = ['/super-admin'];
  const editorPaths = ['/editor'];

  const isSuperAdminRoute = superAdminPaths.some(path => pathname.includes(path));
  const isEditorRoute = editorPaths.some(path => pathname.includes(path));

  // Skip auth check for login/signin pages
  if (pathname.includes('/login') || pathname.includes('/signin')) {
    return NextResponse.next();
  }

  // Super Admin routes - require super_admin role
  if (isSuperAdminRoute) {
    if (!token || token.role !== 'super_admin') {
      return NextResponse.redirect(new URL(`/${lang}/auth/signin`, req.url));
    }
    return NextResponse.next();
  }

  // Editor routes - require editor or super_admin role
  if (isEditorRoute) {
    if (!token || (token.role !== 'editor' && token.role !== 'super_admin')) {
      return NextResponse.redirect(new URL(`/${lang}/auth/signin`, req.url));
    }
    return NextResponse.next();
  }

  // User protected routes - just require any authenticated user
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL(`/${lang}/auth/signin`, req.url));
    }
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

// Specify which routes this middleware applies to
export const config = {
  matcher: [
    // Protected routes
    '/:lang/dashboard/:path*',
    '/:lang/super-admin/:path*',
    '/:lang/editor/:path*',
    '/:lang/post-ad/:path*',
    '/:lang/edit-ad/:path*',
    // Redirect routes
    '/:lang/all-ads',
    '/:lang/search',
  ],
};
