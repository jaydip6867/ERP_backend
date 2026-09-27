import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as salesOrderController from '../controllers/salesOrder.controller.js';

const router = express.Router();
router.use(authenticateUser);

router.get('/processing-metrics', requirePermission('sales', 'can_view'), salesOrderController.getProcessingMetrics);
router.get('/pending', requirePermission('sales', 'can_view'), salesOrderController.getPendingOrders);

router.get('/', requirePermission('sales', 'can_view'), salesOrderController.listOrders);
router.post('/', requirePermission('sales', 'can_create'), salesOrderController.createOrder);
router.get('/:id', requirePermission('sales', 'can_view'), salesOrderController.getOrderById);
router.patch('/:id/status', requirePermission('sales', 'can_edit'), salesOrderController.updateOrderStatus);
router.patch('/:id/approve', requirePermission('sales', 'can_approve'), salesOrderController.approveOrder);
router.post('/:id/reserve', requirePermission('sales', 'can_edit'), salesOrderController.reserveStock);

export default router;
