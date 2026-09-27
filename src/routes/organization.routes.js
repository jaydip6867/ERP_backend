import { Router } from 'express';
import * as orgController from '../controllers/organization.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateUser);

// Organization Tree
router.get('/tree', requirePermission('organization', 'can_view'), orgController.getOrganizationTree);

// Departments
router.get('/departments', requirePermission('organization', 'can_view'), orgController.getDepartments);
router.post('/departments', requirePermission('organization', 'can_create'), orgController.createDepartment);
router.patch('/departments/:id', requirePermission('organization', 'can_edit'), orgController.updateDepartment);
router.put('/departments/:id', requirePermission('organization', 'can_edit'), orgController.updateDepartment);

// Positions
router.get('/positions', requirePermission('organization', 'can_view'), orgController.getPositions);
router.post('/positions', requirePermission('organization', 'can_create'), orgController.createPosition);
router.patch('/positions/:id', requirePermission('organization', 'can_edit'), orgController.updatePosition);
router.put('/positions/:id', requirePermission('organization', 'can_edit'), orgController.updatePosition);

export default router;
