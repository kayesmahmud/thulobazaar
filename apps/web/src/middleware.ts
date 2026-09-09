import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle:
 * 1. eSewa payment callback redirects (when old cached code sent wrong success_url)
 * 2. URL redirects for backward compatibility (old /all-ads and /search URLs)
 * 3. Authentication for protected routes
 */
// First path segments that are real, locale-less entry points. Everything else
// with a single segment and no file extension is junk.
const ROOT_ALLOWLIST = new Set([
  'en', 'ne',            // locales
  'api', '_next',        // framework
  'app', 'auth', 'feeds', // route handlers under src/app
  'oursignboard',        // vanity path, redirected below
  '.well-known',
]);

/**
 * Reject unknown locale-less paths with a real 404.
 *
 * `[lang]` is a dynamic segment, so it matches ANY single-segment path: /.env
 * and /wp-admin rendered the homepage with HTTP 200 (a soft 404) and served
 * ~109KB to every vulnerability scanner. The layout's notFound() cannot fix the
 * status because force-dynamic streams the 200 before the layout body runs, and
 * `dynamicParams = false` is a no-op once a route is force-dynamic — verified
 * against a production build. Middleware is the only place the status can still
 * be decided.
 *
 * Deliberately conservative: only single-segment, extension-less paths are
 * rejected. Anything with a dot (/robots.txt, /sw.js, /favicon.ico, /logo.png)
 * or more than one segment passes straight through untouched.
 */
function isUnknownRootPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) return false;
  const segment = segments[0]!;
  if (ROOT_ALLOWLIST.has(segment)) return false;
  // Dot-files (.env) are junk; dotted filenames (robots.txt) are real.
  if (segment.includes('.') && !segment.startsWith('.')) return false;
  return true;
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;

  if (isUnknownRootPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // ===== GUARD AGAINST BAD LANG SEGMENTS (e.g., "/undefined/") =====
  if (pathname.startsWith('/undefined/')) {
    const fixedPath = `/en${pathname.replace('/undefined', '')}`;
    return NextResponse.redirect(new URL(fixedPath, req.url));
  }

  // ===== SKIP API ROUTES =====
  // API routes handle their own authentication via JWT headers
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ===== VANITY PATHS =====
  // Printed on marketing material and told to shop owners verbally, so they get
  // to work without a locale prefix. Permanent so the localised URL is the one
  // that accrues search value.
  // Next strips the trailing slash before middleware runs, so only the bare path
  // ever reaches here.
  if (pathname === '/oursignboard') {
    return NextResponse.redirect(new URL('/en/oursignboard', req.url), 308);
  }

  // That page is English only, so send every other locale to /en. This has to
  // happen here rather than with a redirect() in the page: [lang] is
  // force-dynamic, so the page body runs only after the 200 has already been
  // streamed, and redirect() there degrades to a client-side one (verified — it
  // returns 200 with a NEXT_REDIRECT payload). Middleware is the only place the
  // status can still be decided.
  if (/^\/(?!en\/)[a-z]{2}\/oursignboard$/.test(pathname)) {
    return NextResponse.redirect(new URL('/en/oursignboard', req.url), 308);
  }

  // ===== ESEWA CALLBACK REDIRECT =====
  // Handle eSewa callbacks that land on wrong URLs (due to old cached code)
  // eSewa returns with ?data= param containing base64 encoded response
  const esewaData = searchParams.get('data');
  if (esewaData && !pathname.includes('/api/payments/callback')) {
    try {
      // Decode and parse the eSewa response to verify it's valid
      const decoded = Buffer.from(esewaData, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);

      // Check if this is a valid eSewa response (has transaction_uuid and status)
      if (parsed.transaction_uuid && parsed.status) {
        console.log(`🔄 eSewa callback detected on ${pathname}, redirecting to callback API...`);

        // Redirect to proper callback handler with the data
        const callbackUrl = new URL('/api/payments/callback', req.url);
        callbackUrl.searchParams.set('gateway', 'esewa');
        callbackUrl.searchParams.set('orderId', parsed.transaction_uuid);
        callbackUrl.searchParams.set('data', esewaData);

        return NextResponse.redirect(callbackUrl);
      }
    } catch (err) {
      // Not a valid eSewa response, continue with normal processing
      console.debug('eSewa response parsing skipped:', err);
    }
  }

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

  // Already-authenticated staff landing on a staff login page go straight to
  // their dashboard. The editor APK cold-starts on the dashboard URL, but this
  // also covers anyone opening a login link while their session is still valid —
  // without it the login form renders and invites a pointless re-login.
  // (Must live here: the editor/super-admin pages are force-dynamic, where a
  // page-level redirect() does not reliably take effect.)
  // super_admin must NOT be sent to the editor dashboard: the editor pages'
  // client guards require strictly role==='editor' and push back to
  // /editor/login, which would loop forever against this redirect.
  if (token && pathname.includes('/editor/login') && token.role === 'editor') {
    return NextResponse.redirect(new URL(`/${lang}/editor/dashboard`, req.url));
  }
  if (token && pathname.includes('/editor/login') && token.role === 'super_admin') {
    return NextResponse.redirect(new URL(`/${lang}/super-admin/dashboard`, req.url));
  }
  if (token && pathname.includes('/super-admin/login') && token.role === 'super_admin') {
    return NextResponse.redirect(new URL(`/${lang}/super-admin/dashboard`, req.url));
  }

  // Skip auth check for login/signin pages
  if (pathname.includes('/login') || pathname.includes('/signin')) {
    return NextResponse.next();
  }

  // Super Admin routes - require super_admin role. Send unauthenticated staff to
  // the staff login, NOT the consumer sign-in page.
  if (isSuperAdminRoute) {
    if (!token || token.role !== 'super_admin') {
      return NextResponse.redirect(new URL(`/${lang}/super-admin/login`, req.url));
    }
    return NextResponse.next();
  }

  // Editor routes - require editor or super_admin role. Unauthenticated → editor login.
  if (isEditorRoute) {
    if (!token || (token.role !== 'editor' && token.role !== 'super_admin')) {
      return NextResponse.redirect(new URL(`/${lang}/editor/login`, req.url));
    }
    return NextResponse.next();
  }

  // User protected routes - just require any authenticated user
  if (isProtectedRoute) {
    if (!token) {
      // Carry the destination so sign-in returns here instead of the homepage.
      const signIn = new URL(`/${lang}/auth/signin`, req.url);
      signIn.searchParams.set('callbackUrl', pathname + req.nextUrl.search);
      return NextResponse.redirect(signIn);
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
    // Vanity path — the locale-less URL we hand out to shop owners — plus the
    // localised form, so non-English locales can be redirected to /en.
    '/oursignboard',
    '/:lang/oursignboard',
    // Ad pages (for eSewa callback handling)
    '/:lang/ad/:slug*',
    // Single-segment paths only, so isUnknownRootPath can 404 junk like
    // /.env and /wp-admin. Scoped to one segment on purpose: the middleware
    // stays off every real page route, so none of the auth/eSewa logic below
    // starts running on traffic it never handled before.
    '/:segment',
  ],
};
