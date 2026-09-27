import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as productionController from '../controllers/production.controller.js';

const router = express.Router();
router.use(authenticateUser);

router.get('/dashboard', requirePermission('production', 'can_view'), productionController.getDashboardMetrics);
router.get('/material-availability', requirePermission('production', 'can_view'), productionController.checkMaterialAvailability);

// Work Orders
router.get('/work-orders', requirePermission('production', 'can_view'), productionController.listWorkOrders);
router.post('/work-orders', requirePermission('production', 'can_create'), productionController.createWorkOrder);
router.get('/work-orders/:id', requirePermission('production', 'can_view'), productionController.getWorkOrderById);
router.post('/work-orders/:id/receive-fg', requirePermission('production', 'can_edit'), productionController.receiveFinishedGoods);
router.get('/work-orders/:id/costing', requirePermission('production', 'can_view_cost'), productionController.getCosting);

// Material Issues
router.get('/material-issues', requirePermission('production', 'can_view'), productionController.listMaterialIssues);
router.post('/material-issues', requirePermission('production', 'can_create'), productionController.issueMaterials);

// Production Logs
router.get('/logs', requirePermission('production', 'can_view'), productionController.listProductionLogs);
router.post('/logs', requirePermission('production', 'can_create'), productionController.createProductionLog);

// Scrap Records
router.get('/scrap', requirePermission('production', 'can_view'), productionController.listScrapRecords);
router.post('/scrap', requirePermission('production', 'can_create'), productionController.createScrapRecord);

export default router;
