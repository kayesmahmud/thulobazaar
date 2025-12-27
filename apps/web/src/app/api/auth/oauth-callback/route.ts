import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';

// =============================================================================
// OAUTH CALLBACK HANDLER
// This route receives the token from backend Passport.js Google OAuth
// and creates a session for the user
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');

    console.log('🔄 OAuth callback received:', { provider, hasToken: !!token });

    if (!token) {
      console.error('❌ No token in OAuth callback');
      return NextResponse.redirect(new URL('/en/auth/signin?error=NoToken', request.url));
    }

    // Verify and decode the token
    const jwtSecret = process.env.JWT_SECRET;
    console.log('🔑 JWT_SECRET available:', !!jwtSecret, 'length:', jwtSecret?.length || 0);

    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not configured');
      return NextResponse.redirect(new URL('/en/auth/signin?error=Configuration', request.url));
    }

    let decoded: { userId: number; email: string; role?: string };
    try {
      decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string; role?: string };
      console.log('✅ Token verified:', { userId: decoded.userId, email: decoded.email });
    } catch (err: any) {
      console.error('❌ Token verification failed:', err?.message || err);
      console.error('Token (first 50 chars):', token?.substring(0, 50));
      return NextResponse.redirect(new URL('/en/auth/signin?error=InvalidToken', request.url));
    }

    // Fetch the full user from database (userId is a number/Int in the database)
    const user = await prisma.users.findUnique({
      where: { id: Number(decoded.userId) },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        account_type: true,
        shop_slug: true,
        business_verification_status: true,
        individual_verified: true,
        avatar: true,
      },
    });

    if (!user) {
      console.error('❌ User not found:', decoded.userId);
      return NextResponse.redirect(new URL('/en/auth/signin?error=UserNotFound', request.url));
    }

    console.log('✅ User found:', user.email);

    // Create a response that stores the token and user in localStorage via client-side redirect
    // We'll redirect to a client page that handles the storage
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      account_type: user.account_type,
      shop_slug: user.shop_slug,
      business_verification_status: user.business_verification_status,
      individual_verified: user.individual_verified,
      avatar: user.avatar,
    }));

    // Redirect to a client-side handler that will store the token
    return NextResponse.redirect(
      new URL(`/en/auth/oauth-success?token=${token}&user=${userData}`, request.url)
    );
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(new URL('/en/auth/signin?error=CallbackError', request.url));
  }
}
