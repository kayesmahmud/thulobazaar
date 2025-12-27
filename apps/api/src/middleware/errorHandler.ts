import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

/**
 * Handle specific error types
 */
const handleJWTError = () =>
  new AuthenticationError('Invalid token. Please log in again.');

const handleJWTExpiredError = () =>
  new AuthenticationError('Your token has expired. Please log in again.');

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  column?: string;
}

const handleDatabaseError = (err: PostgresError): AppError => {
  // PostgreSQL specific errors
  if (err.code === '23505') {
    // Unique violation
    const field = err.detail?.match(/Key \(([^)]+)\)/)?.[1] || 'field';
    return new ConflictError(`A record with this ${field} already exists`);
  }

  if (err.code === '23503') {
    // Foreign key violation
    return new ValidationError('Invalid reference to related data');
  }

  if (err.code === '23502') {
    // Not null violation
    const field = err.column || 'required field';
    return new ValidationError(`${field} is required`);
  }

  if (err.code === '22P02') {
    // Invalid text representation
    return new ValidationError('Invalid data format provided');
  }

  return new DatabaseError('Database operation failed');
};

interface MulterError extends Error {
  code?: string;
}

const handleMulterError = (err: MulterError): AppError => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File size is too large. Maximum size is 5MB per image.');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('Too many files. Maximum is 5 images per ad.');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file upload field.');
  }
  return new ValidationError(err.message);
};

/**
 * Development error response
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Production error response
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  // Programming or unknown error: don't leak error details
  else {
    console.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: AppError & PostgresError & MulterError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log errors
  if (err.statusCode >= 500) {
    console.error(`[ERROR] ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.userId,
      stack: err.stack,
    });
  } else if (err.statusCode >= 400) {
    console.warn(`[WARN] ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.userId,
    });
  }

  if (config.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error: AppError = Object.assign(new AppError(err.message, err.statusCode), err);

    // Handle specific error types
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.name === 'MulterError') error = handleMulterError(err);

    // Database errors
    if (err.code && err.code.startsWith('2')) {
      error = handleDatabaseError(err);
    }

    sendErrorProd(error, res);
  }
};

/**
 * Catch 404 and forward to error handler
 */
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const err = new NotFoundError(`Cannot find ${req.originalUrl} on this server`);
  next(err);
};

/**
 * Async error wrapper - catches errors in async route handlers
 */
export const catchAsync = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};
