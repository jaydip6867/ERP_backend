import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import {
  getCeoDashboard,
  getFounderDecisions,
  executeDecisionAction,
  getAssistantAgenda,
} from '../controllers/executiveCockpits.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/ceo-dashboard', requirePermission('dashboard', 'can_view'), getCeoDashboard);
router.get('/founder-decisions', requirePermission('dashboard', 'can_view'), getFounderDecisions);
router.post('/founder-decisions/:id/actions', requirePermission('dashboard', 'can_approve'), executeDecisionAction);
router.get('/assistant-agenda', requirePermission('dashboard', 'can_view'), getAssistantAgenda);

export default router;
