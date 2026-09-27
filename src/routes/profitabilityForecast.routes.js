import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import {
  getComprehensiveProfitability,
  getProductProfitability,
  getForecasts,
} from '../controllers/profitabilityForecast.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/statement', requirePermission('finance', 'can_view_cost'), getComprehensiveProfitability);
router.get('/products', requirePermission('finance', 'can_view_cost'), getProductProfitability);
router.get('/forecasts', requirePermission('reports', 'can_view'), getForecasts);

export default router;
