import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import {
  getMarketingDashboard,
  getCampaigns,
  createCampaign,
  getCampaignPerformance,
  addCampaignSpend,
} from '../controllers/marketing.controller.js';
import * as extController from '../controllers/extensions.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/dashboard', requirePermission('marketing', 'can_view'), getMarketingDashboard);
router.get('/campaigns', requirePermission('marketing', 'can_view'), getCampaigns);
router.post('/campaigns', requirePermission('marketing', 'can_create'), createCampaign);
router.get('/campaigns/:id/performance', requirePermission('marketing', 'can_view'), getCampaignPerformance);
router.post('/campaigns/:id/spends', requirePermission('marketing', 'can_create'), addCampaignSpend);

// Marketing Extensions
router.get('/assets', requirePermission('marketing', 'can_view'), extController.getMarketingAssets);
router.post('/assets', requirePermission('marketing', 'can_create'), extController.createMarketingAsset);
router.get('/content', requirePermission('marketing', 'can_view'), extController.getContentItems);
router.post('/content', requirePermission('marketing', 'can_create'), extController.createContentItem);
router.get('/creatives', requirePermission('marketing', 'can_view'), extController.getCreativeRequests);
router.post('/creatives', requirePermission('marketing', 'can_create'), extController.createCreativeRequest);
router.get('/physical', requirePermission('marketing', 'can_view'), extController.getPhysicalMarketing);
router.post('/physical', requirePermission('marketing', 'can_create'), extController.createPhysicalMarketing);

export default router;
