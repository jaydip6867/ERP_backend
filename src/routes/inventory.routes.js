import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as inventoryController from '../controllers/inventory.controller.js';

const router = express.Router();
router.use(authenticateUser);

router.get('/dashboard', requirePermission('inventory', 'can_view'), inventoryController.getDashboardMetrics);
router.get('/summary', requirePermission('inventory', 'can_view'), inventoryController.getStockSummary);
router.get('/ledger', requirePermission('inventory', 'can_view'), inventoryController.getStockLedger);

// Transfers
router.get('/transfers', requirePermission('inventory', 'can_view'), inventoryController.listTransfers);
router.post('/transfers', requirePermission('inventory', 'can_create'), inventoryController.createTransfer);
router.put('/transfers/:id/complete', requirePermission('inventory', 'can_edit'), inventoryController.completeTransfer);

// Adjustments
router.get('/adjustments', requirePermission('inventory', 'can_view'), inventoryController.listAdjustments);
router.post('/adjustments', requirePermission('inventory', 'can_create'), inventoryController.createAdjustment);
router.put('/adjustments/:id/approve', requirePermission('inventory', 'can_approve'), inventoryController.approveAdjustment);

// Batches & Quarantine
router.get('/batches', requirePermission('inventory', 'can_view'), inventoryController.listBatches);
router.patch('/batches/:id/status', requirePermission('inventory', 'can_edit'), inventoryController.updateBatchStatus);

// Reservations
router.get('/reservations', requirePermission('inventory', 'can_view'), inventoryController.listReservations);

// Physical Counts
router.get('/physical-counts', requirePermission('inventory', 'can_view'), inventoryController.listPhysicalCounts);

export default router;
