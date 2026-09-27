import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import {
  getMeetings,
  createMeeting,
  getMeetingById,
  updateMeetingMinutes,
  getTasks,
  createTask,
  updateTaskStatus,
  getCalendarEvents,
  createCalendarEvent,
} from '../controllers/productivity.controller.js';

const router = Router();
router.use(authenticateUser);

// Meetings
router.get('/meetings', getMeetings);
router.post('/meetings', createMeeting);
router.get('/meetings/:id', getMeetingById);
router.put('/meetings/:id/minutes', updateMeetingMinutes);

// Todo Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id/status', updateTaskStatus);

// Calendar Events
router.get('/calendar', getCalendarEvents);
router.post('/calendar', createCalendarEvent);

export default router;
