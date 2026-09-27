import * as authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
    ip,
    userAgent,
  });

  if (result.requires_2fa) {
    return ApiResponse.success(
      res,
      result,
      'Two-factor verification required to complete sign in',
      200
    );
  }

  return ApiResponse.success(res, result, 'Sign in successful', 200);
});

/**
 * POST /api/v1/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  const result = await authService.refreshSession({
    refreshToken: req.body.refreshToken,
    ip,
    userAgent,
  });

  return ApiResponse.success(res, result, 'Session successfully renewed', 200);
});

/**
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const refreshToken = req.body?.refreshToken;

  await authService.logout(userId, refreshToken);
  return ApiResponse.success(res, null, 'Logged out successfully', 200);
});

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword({ email: req.body.email });
  return ApiResponse.success(res, result, result.message, 200);
});

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword({
    token: req.body.token,
    newPassword: req.body.newPassword,
  });
  return ApiResponse.success(res, result, result.message, 200);
});

/**
 * POST /api/v1/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const result = await authService.changePassword({
    userId,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });

  return ApiResponse.success(res, result, 'Password updated successfully', 200);
});

/**
 * GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const user = await authService.getCurrentUser(userId);
  return ApiResponse.success(res, { user }, 'Current user profile retrieved', 200);
});

/**
 * PATCH /api/v1/auth/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const updatedUser = await authService.updateUserProfile(userId, req.body);
  return ApiResponse.success(res, { user: updatedUser }, 'Profile updated successfully', 200);
});
