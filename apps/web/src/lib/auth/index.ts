/**
 * Auth module - Authentication, JWT, and session management
 */

// Re-export JWT utilities
export {
  verifyToken,
  createToken,
  requireAuth,
  requireRole,
  requireAdmin,
  requireEditor,
  requireSuperAdmin,
  optionalAuth,
  type JWTPayload,
} from './jwt';

// Re-export session utilities
export * from './session';

// Re-export authOptions
export { authOptions } from './authOptions';
