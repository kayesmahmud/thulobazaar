import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

/**
 * Get the current session on the server side
 * Use this in Server Components, Server Actions, and API Routes
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string) {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Require a specific role
 */
export async function requireRole(role: string) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error('Forbidden');
  }
  return user;
}
