import { Router } from 'express';
import * as dashController from '../controllers/dashboard.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/founder', requirePermission('dashboards', 'can_view'), dashController.getFounderDashboard);
router.get('/ceo', requirePermission('dashboards', 'can_view'), dashController.getCeoDashboard);
router.get('/cro', requirePermission('dashboards', 'can_view'), dashController.getCroDashboard);
router.get('/cmo', requirePermission('dashboards', 'can_view'), dashController.getCmoDashboard);
router.get('/coo', requirePermission('dashboards', 'can_view'), dashController.getCooDashboard);
router.get('/cfo', requirePermission('dashboards', 'can_view'), dashController.getCfoDashboard);
router.get('/chro', requirePermission('dashboards', 'can_view'), dashController.getChroDashboard);
router.get('/cto', requirePermission('dashboards', 'can_view'), dashController.getCtoDashboard);
router.get('/rnd', requirePermission('dashboards', 'can_view'), dashController.getRndDashboard);

export default router;
