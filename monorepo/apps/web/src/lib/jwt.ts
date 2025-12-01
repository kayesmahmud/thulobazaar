import { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { getToken as getNextAuthToken } from 'next-auth/jwt';

// Get JWT secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  [key: string]: unknown;  // Index signature for jose compatibility
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyToken(request: NextRequest): Promise<JWTPayload | null> {
  // First, check Authorization header (used by backend-issued JWT)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      return verified.payload as unknown as JWTPayload;
    } catch (error) {
      console.error('JWT verification error:', error);
    }
  }

  // Fallback: try NextAuth JWT from cookies (browser session)
  if (NEXTAUTH_SECRET) {
    try {
      const nextAuthToken = await getNextAuthToken({ req: request as any, secret: NEXTAUTH_SECRET });
      if (nextAuthToken?.id) {
        return {
          userId: parseInt(nextAuthToken.id as string, 10),
          email: (nextAuthToken.email as string) || '',
          role: (nextAuthToken.role as string) || 'user',
        };
      }
    } catch (error) {
      console.error('NextAuth token verification error:', error);
    }
  }

  return null;
}

/**
 * Create a new JWT token
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify authentication and return user ID
 * Throws error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<number> {
  const payload = await verifyToken(request);
  if (!payload || !payload.userId) {
    throw new Error('Unauthorized');
  }
  return payload.userId;
}

/**
 * Verify authentication and check for specific role
 */
export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<JWTPayload> {
  const payload = await verifyToken(request);
  if (!payload || !payload.userId) {
    throw new Error('Unauthorized');
  }

  if (!allowedRoles.includes(payload.role)) {
    throw new Error('Forbidden');
  }

  return payload;
}

/**
 * Check if user is admin or super_admin
 */
export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  return requireRole(request, ['super_admin']);
}

/**
 * Check if user is editor or super_admin
 */
export async function requireEditor(request: NextRequest): Promise<JWTPayload> {
  return requireRole(request, ['super_admin', 'editor']);
}

/**
 * Optional auth - returns user ID if authenticated, null otherwise
 * Does not throw error
 */
export async function optionalAuth(request: NextRequest): Promise<number | null> {
  const payload = await verifyToken(request);
  return payload?.userId ?? null;
}
