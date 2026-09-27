import { User } from '../models/user.model.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/token.util.js';

/**
 * Middleware guarding routes requiring authentication.
 * Validates Bearer JWT access token and attaches authenticated user document to req.user.
 */
export const authenticateUser = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(AppError.unauthorized('Authentication token required. Please sign in to access this resource.'));
  }

  // 1. Verify token validity
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Your session has expired. Please sign in again.'));
    }
    return next(AppError.unauthorized('Invalid authentication token.'));
  }

  // 2. Check if user still exists
  const user = await User.findById(decoded.id).select('+password_changed_at');
  if (!user) {
    return next(AppError.unauthorized('The user belonging to this token no longer exists.'));
  }

  // 3. Check account status
  if (user.status === 'locked' && user.isLocked()) {
    return next(
      new AppError(
        'Account is locked due to too many failed attempts. Please try again later.',
        423
      )
    );
  }

  if (user.status !== 'active') {
    return next(AppError.forbidden(`Your account is currently ${user.status}. Please contact support.`));
  }

  // 4. Check if user changed password after the token was issued
  if (decoded.iat && user.isPasswordChangedAfter(decoded.iat)) {
    return next(
      AppError.unauthorized('Your password was recently changed. Please sign in again with your new credentials.')
    );
  }

  // 5. Grant access
  req.user = user;
  next();
});
