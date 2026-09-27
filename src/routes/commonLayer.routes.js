import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  globalSearch,
} from '../controllers/commonLayer.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

router.get('/search', globalSearch);

export default router;
