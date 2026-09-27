import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import {
  getTickets,
  createTicket,
  getTicketById,
  addActivity,
  escalateTicket,
  resolveTicket,
  getSupportDashboard,
  getRootCauses,
  createRootCause,
  getCustomerFeedbacks,
  createCustomerFeedback,
} from '../controllers/customerService.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/dashboard', requirePermission('support', 'can_view'), getSupportDashboard);
router.get('/tickets', requirePermission('support', 'can_view'), getTickets);
router.post('/tickets', requirePermission('support', 'can_create'), createTicket);
router.get('/tickets/:id', requirePermission('support', 'can_view'), getTicketById);
router.post('/tickets/:id/activities', requirePermission('support', 'can_edit'), addActivity);
router.put('/tickets/:id/escalate', requirePermission('support', 'can_edit'), escalateTicket);
router.put('/tickets/:id/resolve', requirePermission('support', 'can_edit'), resolveTicket);

router.get('/capa', requirePermission('support', 'can_view'), getRootCauses);
router.post('/capa', requirePermission('support', 'can_create'), createRootCause);

router.get('/feedbacks', requirePermission('support', 'can_view'), getCustomerFeedbacks);
router.post('/feedbacks', requirePermission('support', 'can_create'), createCustomerFeedback);

export default router;
