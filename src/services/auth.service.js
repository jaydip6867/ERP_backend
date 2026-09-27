import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/token.util.js';

/**
 * Handle user credential authentication and session initiation.
 */
export const login = async ({ email, password, ip, userAgent }) => {
  // Find user and explicitly select password_hash & refresh_tokens
  const user = await User.findOne({ email }).select(
    '+password_hash +refresh_tokens +lock_until +failed_login_count'
  );

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // 1. Check account lockout status
  if (user.isLocked()) {
    const remainingMs = user.lock_until.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    throw new AppError(
      `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      423
    );
  }

  // 2. Validate password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.handleFailedLogin(env.MAX_FAILED_LOGIN_ATTEMPTS, env.LOCK_TIME_MINUTES);
    const attemptsLeft = env.MAX_FAILED_LOGIN_ATTEMPTS - user.failed_login_count;

    if (attemptsLeft <= 0) {
      throw new AppError(
        `Account has been locked for ${env.LOCK_TIME_MINUTES} minutes due to repeated failed login attempts.`,
        423
      );
    }

    throw AppError.unauthorized(
      `Invalid email or password. ${attemptsLeft} attempt(s) remaining before account lockout.`
    );
  }

  // 3. Check status
  if (user.status !== 'active') {
    throw AppError.forbidden(`Your account is currently ${user.status}. Please contact the administrator.`);
  }

  // 4. Optional 2FA-ready architecture check
  if (user.two_factor_enabled) {
    const tempToken = crypto.randomBytes(32).toString('hex');
    return {
      requires_2fa: true,
      temp_token: tempToken,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }

  // 5. Successful login: reset failed login attempts and update last login metadata
  await user.handleSuccessfulLogin(ip);

  // 6. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 7. Store hashed refresh token in session registry (keep latest 5 sessions)
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refresh_tokens = (user.refresh_tokens || []).filter(
    (t) => t.expires_at > new Date()
  );

  user.refresh_tokens.push({
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: userAgent,
    ip,
  });

  // Limit to 5 concurrent sessions
  if (user.refresh_tokens.length > 5) {
    user.refresh_tokens.shift();
  }

  await user.save({ validateBeforeSave: false });

  // Populate role details for permissions computation
  await user.populate('role_id');
  const { getUserPermissions } = await import('./permission.service.js');
  const permissions = await getUserPermissions(user);

  return {
    requires_2fa: false,
    accessToken,
    refreshToken,
    user: {
      ...user.toJSON(),
      permissions,
    },
  };
};

/**
 * Rotate refresh token and issue new access token.
 */
export const refreshSession = async ({ refreshToken, ip, userAgent }) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired refresh token. Please sign in again.');
  }

  const tokenHash = hashToken(refreshToken);
  const user = await User.findById(decoded.id).select('+refresh_tokens');

  if (!user || user.status !== 'active') {
    throw AppError.unauthorized('User session is invalid or user no longer active.');
  }

  const sessionIndex = (user.refresh_tokens || []).findIndex(
    (s) => s.token_hash === tokenHash && s.expires_at > new Date()
  );

  if (sessionIndex === -1) {
    throw AppError.unauthorized('Session has expired or was revoked. Please sign in again.');
  }

  // Rotate tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newTokenHash = hashToken(newRefreshToken);

  user.refresh_tokens[sessionIndex] = {
    token_hash: newTokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    user_agent: userAgent,
    ip,
    created_at: new Date(),
  };

  await user.save({ validateBeforeSave: false });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: user.toJSON(),
  };
};

/**
 * Invalidate user refresh token / session.
 */
export const logout = async (userId, refreshToken = null) => {
  if (!userId) return;

  const user = await User.findById(userId).select('+refresh_tokens');
  if (!user) return;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    user.refresh_tokens = (user.refresh_tokens || []).filter(
      (s) => s.token_hash !== tokenHash
    );
  } else {
    user.refresh_tokens = [];
  }

  await user.save({ validateBeforeSave: false });
};

/**
 * Initiate password reset flow.
 */
export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });

  // Security best practice: don't reveal if user does not exist
  if (!user || user.status !== 'active') {
    return {
      message: 'If an active account exists with that email address, a password reset link has been dispatched.',
    };
  }

  const resetToken = user.createPasswordResetToken(env.PASSWORD_RESET_EXPIRES_MINUTES);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  logger.info(`[AUTH] Password reset requested for ${user.email}. Reset URL: ${resetUrl}`);

  return {
    message: 'If an active account exists with that email address, a password reset link has been dispatched.',
    // In development mode, provide resetToken & resetUrl for testing
    ...(env.isDevelopment && {
      dev_info: {
        resetToken,
        resetUrl,
      },
    }),
  };
};

/**
 * Reset password using verification token.
 */
export const resetPassword = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    password_reset_token: hashedToken,
    password_reset_expires: { $gt: Date.now() },
  }).select('+password_hash +refresh_tokens');

  if (!user) {
    throw AppError.badRequest('Password reset token is invalid or has expired.');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(newPassword, salt);
  user.password_changed_at = new Date();
  user.must_change_password = false;
  user.password_reset_token = null;
  user.password_reset_expires = null;
  user.failed_login_count = 0;
  user.lock_until = null;
  if (user.status === 'locked') {
    user.status = 'active';
  }

  // Invalidate all old sessions for security
  user.refresh_tokens = [];

  // Generate fresh session tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refresh_tokens.push({
    token_hash: hashToken(refreshToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });

  await user.save({ validateBeforeSave: false });

  return {
    message: 'Password successfully updated. You are now authenticated.',
    accessToken,
    refreshToken,
    user: user.toJSON(),
  };
};

/**
 * Change password from authenticated session.
 */
export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password_hash +refresh_tokens');

  if (!user) {
    throw AppError.notFound('User not found');
  }

  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    throw AppError.badRequest('Current password provided is incorrect.');
  }

  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(newPassword, salt);
  user.password_changed_at = new Date();
  user.must_change_password = false;

  // Clear older refresh tokens
  user.refresh_tokens = [];

  // Create new session
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refresh_tokens.push({
    token_hash: hashToken(refreshToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });

  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
    user: user.toJSON(),
  };
};

/**
 * Retrieve current user profile with role and computed permissions.
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).populate('role_id');
  if (!user) {
    throw AppError.notFound('User profile not found');
  }
  const { getUserPermissions } = await import('./permission.service.js');
  const permissions = await getUserPermissions(user);

  return {
    ...user.toJSON(),
    permissions,
  };
};

/**
 * Update current user profile fields.
 */
export const updateUserProfile = async (userId, updates) => {
  const allowedFields = [
    'full_name',
    'mobile',
    'language',
    'timezone',
    'default_dashboard',
    'profile_photo',
  ];

  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, filteredUpdates, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw AppError.notFound('User not found');
  }

  return updatedUser.toJSON();
};
