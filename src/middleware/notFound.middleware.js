import { AppError } from '../utils/appError.js';

/**
 * Middleware handling unrouted requests with a 404 AppError.
 */
export const notFoundMiddleware = (req, res, next) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  next(AppError.notFound(message));
};

// Alias for flexibility
export const notFoundHandler = notFoundMiddleware;
