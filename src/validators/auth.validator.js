import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: 'Reset token is required' })
      .min(10, 'Invalid reset token format'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z
      .string({ required_error: 'Password confirmation is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z
      .string({ required_error: 'Password confirmation is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password cannot be the same as the current password',
    path: ['newPassword'],
  });

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must have at least 2 characters').optional(),
  mobile: z.string().max(20, 'Mobile number is too long').optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(2).max(50).optional(),
  default_dashboard: z.string().min(2).max(50).optional(),
});
