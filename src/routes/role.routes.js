import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  createRoleSchema,
  updatePermissionsSchema,
  updateRoleSchema,
} from '../validators/role.validator.js';

const router = Router();

// All role endpoints require user authentication
router.use(authenticateUser);

// Roles CRUD
router.get('/', requirePermission('roles', 'can_view'), roleController.getRoles);
router.post(
  '/',
  requirePermission('roles', 'can_create'),
  validate(createRoleSchema),
  roleController.createRole
);
router.put(
  '/:id',
  requirePermission('roles', 'can_edit'),
  validate(updateRoleSchema),
  roleController.updateRole
);

// Granular Role Permissions Matrix
router.get(
  '/:id/permissions',
  requirePermission('roles', 'can_view'),
  roleController.getRolePermissions
);
router.put(
  '/:id/permissions',
  requirePermission('roles', 'can_edit'),
  validate(updatePermissionsSchema),
  roleController.updateRolePermissions
);

export default router;
