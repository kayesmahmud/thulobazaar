import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AuthenticationError } from './errorHandler.js';

interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticate JWT token
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 [Middleware/Auth] Token present:', !!token);

  if (!token) {
    next(new AuthenticationError('Access token required'));
    return;
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ [Middleware/Auth] Token verification failed:', err.message);
      next(new AuthenticationError('Invalid or expired token'));
      return;
    }

    const user = decoded as JwtPayload;
    console.log('✅ [Middleware/Auth] Token decoded successfully - user:', user);
    req.user = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
    next();
  });
};

/**
 * Check if user is admin
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    next(new AuthenticationError('Admin access required'));
    return;
  }
  next();
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      const user = decoded as JwtPayload;
      req.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };
    }
    next();
  });
};

/**
 * Require regular user (not editor or admin)
 */
export const requireRegularUser = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role === 'editor' || req.user?.role === 'super_admin') {
    next(new AuthenticationError('This feature is not available for editors and admins'));
    return;
  }
  next();
};
