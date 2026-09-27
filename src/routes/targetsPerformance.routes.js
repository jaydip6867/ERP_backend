import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import {
  getTargets,
  createTarget,
  getLeaderboard,
} from '../controllers/targetsPerformance.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/targets', requirePermission('reports', 'can_view'), getTargets);
router.post('/targets', requirePermission('reports', 'can_create'), createTarget);
router.get('/leaderboard', requirePermission('reports', 'can_view'), getLeaderboard);

export default router;
