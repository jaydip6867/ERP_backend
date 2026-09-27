import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as leadController from '../controllers/lead.controller.js';

const router = express.Router();

router.use(authenticateUser);

// Dashboard & Kanban
router.get('/dashboard', requirePermission('Lead', 'can_view'), leadController.getDashboard);
router.get('/kanban', requirePermission('Lead', 'can_view'), leadController.getKanban);

// Follow-ups
router.get('/followups', requirePermission('Lead', 'can_view'), leadController.listFollowups);
router.post('/followups', requirePermission('Lead', 'can_create'), leadController.createFollowup);
router.put('/followups/:id/complete', requirePermission('Lead', 'can_edit'), leadController.completeFollowup);

// Leads CRUD
router.get('/', requirePermission('Lead', 'can_view'), leadController.listLeads);
router.get('/:id', requirePermission('Lead', 'can_view'), leadController.getLeadById);
router.post('/', requirePermission('Lead', 'can_create'), leadController.createLead);
router.put('/:id', requirePermission('Lead', 'can_edit'), leadController.updateLead);
router.put('/:id/stage', requirePermission('Lead', 'can_edit'), leadController.updateStage);
router.post('/:id/convert', requirePermission('Lead', 'can_edit'), leadController.convertToCustomer);

export default router;
