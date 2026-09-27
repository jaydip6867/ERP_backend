import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import {
  getRepeatDashboard,
  scheduleRepeatOrders,
  updateRepeatOrderStatus,
  getUpsellDashboard,
  generateUpsell,
  updateUpsellStatus,
} from '../controllers/repeatUpsell.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/repeat-orders/dashboard', requirePermission('sales', 'can_view'), getRepeatDashboard);
router.post('/repeat-orders/schedule', requirePermission('sales', 'can_create'), scheduleRepeatOrders);
router.put('/repeat-orders/:id', requirePermission('sales', 'can_edit'), updateRepeatOrderStatus);

router.get('/upsell/dashboard', requirePermission('sales', 'can_view'), getUpsellDashboard);
router.post('/upsell/generate', requirePermission('sales', 'can_create'), generateUpsell);
router.put('/upsell/:id', requirePermission('sales', 'can_edit'), updateUpsellStatus);

export default router;
