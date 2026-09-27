import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

/**
 * Handle Mongoose CastError (e.g., malformed ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid format for field '${err.path}': ${err.value}`;
  return AppError.badRequest(message);
};

/**
 * Handle Mongoose duplicate key error (code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const keys = Object.keys(err.keyValue || {});
  const field = keys[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
  return AppError.conflict(message, [{ field, message }]);
};

/**
 * Handle Mongoose schema validation error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => ({
    field: el.path,
    message: el.message,
    value: el.value,
  }));
  const message = `Database validation failed: ${errors.map((e) => e.message).join('. ')}`;
  return AppError.unprocessable(message, errors);
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () => AppError.unauthorized('Invalid authentication token. Please log in again.');
const handleJWTExpiredError = () => AppError.unauthorized('Your authentication token has expired. Please log in again.');

/**
 * Centralized Error Middleware
 */
export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Transform known DB/library errors into AppError instances
  if (err.name === 'CastError') {
    error = handleCastErrorDB(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationErrorDB(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = AppError.badRequest('Malformed JSON in request body');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];
  const requestId = req.id || req.requestId || null;

  // Log error with correlation metadata
  logger.error(
    `[${requestId || 'NO_REQ_ID'}] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`,
    {
      statusCode,
      errors,
      stack: env.isDevelopment ? err.stack : undefined,
    }
  );

  // Send standardized API error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
    ...(env.isDevelopment && { stack: err.stack }),
  });
};

// Alias for backward compatibility
export const errorHandler = errorMiddleware;
