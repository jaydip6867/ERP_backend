import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as dispatchController from '../controllers/dispatch.controller.js';

const router = express.Router();
router.use(authenticateUser);

// Transporters
router.get('/transporters', requirePermission('sales', 'can_view'), dispatchController.listTransporters);
router.post('/transporters', requirePermission('sales', 'can_create'), dispatchController.createTransporter);

// Dispatches
router.get('/', requirePermission('sales', 'can_view'), dispatchController.listDispatches);
router.post('/', requirePermission('sales', 'can_create'), dispatchController.createDispatch);
router.get('/:id', requirePermission('sales', 'can_view'), dispatchController.getDispatchById);
router.post('/:id/ship', requirePermission('sales', 'can_edit'), dispatchController.shipDispatch);
router.post('/:id/pod', requirePermission('sales', 'can_edit'), dispatchController.recordPod);

// Returns
router.get('/returns/list', requirePermission('sales', 'can_view'), dispatchController.listReturns);
router.post('/returns', requirePermission('sales', 'can_create'), dispatchController.createReturn);
router.put('/returns/:id/restock', requirePermission('sales', 'can_edit'), dispatchController.restockReturn);

export default router;
