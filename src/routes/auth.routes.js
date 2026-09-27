import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public Authentication Endpoints
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Authenticated Endpoints
router.post('/logout', authenticateUser, authController.logout);
router.get('/me', authenticateUser, authController.getCurrentUser);
router.patch('/profile', authenticateUser, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticateUser, validate(changePasswordSchema), authController.changePassword);

export default router;
