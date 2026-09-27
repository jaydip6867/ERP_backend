import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

// All Admin Foundation routes require authentication
router.use(authenticateUser);

// 1. Users CRUD
router.get('/users', requirePermission('users', 'can_view'), adminController.getUsers);
router.get('/users/:id', requirePermission('users', 'can_view'), adminController.getUserById);
router.post('/users', requirePermission('users', 'can_create'), adminController.createUser);
router.put('/users/:id', requirePermission('users', 'can_edit'), adminController.updateUser);

// 2. Company Profile
router.get('/company', requirePermission('settings', 'can_view'), adminController.getCompanyProfile);
router.put('/company', requirePermission('settings', 'can_edit'), adminController.updateCompanyProfile);

// 3. Branches
router.get('/branches', requirePermission('settings', 'can_view'), adminController.getBranches);
router.post('/branches', requirePermission('settings', 'can_create'), adminController.createBranch);
router.put('/branches/:id', requirePermission('settings', 'can_edit'), adminController.updateBranch);

// 4. Warehouses
router.get('/warehouses', requirePermission('warehouse', 'can_view'), adminController.getWarehouses);
router.post('/warehouses', requirePermission('warehouse', 'can_create'), adminController.createWarehouse);
router.put('/warehouses/:id', requirePermission('warehouse', 'can_edit'), adminController.updateWarehouse);

// 5. Number Series
router.get('/number-series', requirePermission('settings', 'can_view'), adminController.getAllNumberSeries);
router.put('/number-series/:id', requirePermission('settings', 'can_edit'), adminController.updateNumberSeries);
router.get('/number-series/:module/preview', requirePermission('settings', 'can_view'), adminController.previewNextNumber);

// 6. Master Data
router.get('/master-data', adminController.getMasterData);
router.post('/master-data', requirePermission('settings', 'can_create'), adminController.createMasterData);
router.put('/master-data/:id', requirePermission('settings', 'can_edit'), adminController.updateMasterData);

// 7. System Settings
router.get('/settings', requirePermission('settings', 'can_view'), adminController.getSystemSettings);
router.put('/settings', requirePermission('settings', 'can_edit'), adminController.updateSystemSettings);

// 8. Audit Logs & Login History
router.get('/audit-logs', requirePermission('settings', 'can_view'), adminController.getAuditLogs);
router.get('/login-history', requirePermission('settings', 'can_view'), adminController.getLoginHistory);

export default router;
