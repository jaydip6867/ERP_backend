/**
 * Centralized Application Error Class for operational and business logic errors.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errors = [], isOperational = true, stack = '') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized: Authentication required') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden: Access denied') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message = 'Resource conflict detected', errors = []) {
    return new AppError(message, 409, errors);
  }

  static unprocessable(message = 'Validation failed', errors = []) {
    return new AppError(message, 422, errors);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, [], false);
  }
}

// Backward-compatible alias
export { AppError as ApiError };
