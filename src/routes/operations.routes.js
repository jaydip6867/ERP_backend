import { Router } from 'express';
import * as extController from '../controllers/extensions.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/dashboard', requirePermission('operations', 'can_view'), extController.getOperationsDashboard);
router.get('/supply-chain', requirePermission('operations', 'can_view'), extController.getSupplyChainPlans);
router.post('/supply-chain', requirePermission('operations', 'can_create'), extController.createSupplyChainPlan);
router.get('/product-merchandising', requirePermission('operations', 'can_view'), extController.getMerchandisingProducts);
router.get('/vendor-management', requirePermission('operations', 'can_view'), extController.getVendorManagementData);

// Jobs
router.get('/printing', requirePermission('operations', 'can_view'), extController.getPrintingJobs);
router.post('/printing', requirePermission('operations', 'can_create'), extController.createPrintingJob);

router.get('/embroidery', requirePermission('operations', 'can_view'), extController.getEmbroideryJobs);
router.post('/embroidery', requirePermission('operations', 'can_create'), extController.createEmbroideryJob);

router.get('/packing', requirePermission('operations', 'can_view'), extController.getPackingJobs);
router.post('/packing', requirePermission('operations', 'can_create'), extController.createPackingJob);

router.get('/logistics', requirePermission('operations', 'can_view'), extController.getLogisticsJobs);
router.post('/logistics', requirePermission('operations', 'can_create'), extController.createLogisticsJob);

export default router;
