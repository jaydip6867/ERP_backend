import { Router } from 'express';
import * as techController from '../controllers/technology.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateUser);

// Dashboard
router.get('/dashboard', requirePermission('technology', 'can_view'), techController.getTechDashboard);

// Integrations (requires can_manage_integrations or can_create/can_edit)
router.get('/integrations', requirePermission('technology', 'can_view'), techController.getIntegrations);
router.post('/integrations', requirePermission('technology', 'can_manage_integrations'), techController.createIntegration);
router.patch('/integrations/:id', requirePermission('technology', 'can_manage_integrations'), techController.updateIntegration);
router.put('/integrations/:id', requirePermission('technology', 'can_manage_integrations'), techController.updateIntegration);
router.post('/integrations/:id/test', requirePermission('technology', 'can_manage_integrations'), techController.testIntegration);

// Automation Rules & Runs (requires can_run_automation or can_create/can_edit)
router.get('/automation-rules', requirePermission('technology', 'can_view'), techController.getAutomationRules);
router.post('/automation-rules', requirePermission('technology', 'can_create'), techController.createAutomationRule);
router.patch('/automation-rules/:id', requirePermission('technology', 'can_edit'), techController.updateAutomationRule);
router.put('/automation-rules/:id', requirePermission('technology', 'can_edit'), techController.updateAutomationRule);
router.post('/automation-rules/:id/run', requirePermission('technology', 'can_run_automation'), techController.runAutomationRule);
router.get('/automation-runs', requirePermission('technology', 'can_view'), techController.getAutomationRuns);

// BI Reports
router.get('/bi-reports', requirePermission('technology', 'can_view'), techController.getBiReports);

// System Health Diagnostics
router.get('/system-health', requirePermission('technology', 'can_view'), techController.getSystemHealth);

// Webhooks & Portal Users
router.get('/webhooks', requirePermission('technology', 'can_view'), techController.getWebhooks);
router.get('/portal-users', requirePermission('technology', 'can_view'), techController.getPortalUsers);

export default router;
