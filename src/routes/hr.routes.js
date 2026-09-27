import { Router } from 'express';
import * as hrController from '../controllers/hr.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

router.use(authenticateUser);

// Dashboard
router.get('/dashboard', requirePermission('hr', 'can_view'), hrController.getHrDashboard);

// Employees
router.get('/employees', requirePermission('hr', 'can_view'), hrController.getEmployees);
router.post('/employees', requirePermission('hr', 'can_create'), hrController.createEmployee);
router.get('/employees/:id', requirePermission('hr', 'can_view'), hrController.getEmployeeById);
router.patch('/employees/:id', requirePermission('hr', 'can_edit'), hrController.updateEmployee);
router.put('/employees/:id', requirePermission('hr', 'can_edit'), hrController.updateEmployee);
router.delete('/employees/:id', requirePermission('hr', 'can_delete'), hrController.deleteEmployee);

// Recruitment
router.get('/job-openings', requirePermission('hr', 'can_view'), hrController.getJobOpenings);
router.post('/job-openings', requirePermission('hr', 'can_create'), hrController.createJobOpening);

router.get('/candidates', requirePermission('hr', 'can_view'), hrController.getCandidates);
router.post('/candidates', requirePermission('hr', 'can_create'), hrController.createCandidate);
router.patch('/candidates/:id', requirePermission('hr', 'can_edit'), hrController.updateCandidate);
router.put('/candidates/:id', requirePermission('hr', 'can_edit'), hrController.updateCandidate);

router.get('/interviews', requirePermission('hr', 'can_view'), hrController.getInterviews);
router.post('/interviews', requirePermission('hr', 'can_create'), hrController.createInterview);

router.get('/onboarding', requirePermission('hr', 'can_view'), hrController.getOnboarding);
router.post('/onboarding', requirePermission('hr', 'can_create'), hrController.createOnboarding);

// Attendance & Leave
router.get('/attendance', requirePermission('hr', 'can_view'), hrController.getAttendance);
router.post('/attendance', requirePermission('hr', 'can_create'), hrController.recordAttendance);

router.get('/leave', requirePermission('hr', 'can_view'), hrController.getLeaveRequests);
router.post('/leave', requirePermission('hr', 'can_create'), hrController.createLeaveRequest);
router.post('/leave/:id/approve', requirePermission('hr', 'can_approve'), hrController.approveLeaveRequest);
router.post('/leave/:id/reject', requirePermission('hr', 'can_approve'), hrController.rejectLeaveRequest);

// Payroll (requires can_view_salary or can_view on hr with sensitive guard)
router.get('/payroll', requirePermission('hr', 'can_view_salary'), hrController.getPayroll);
router.post('/payroll/run', requirePermission('hr', 'can_approve'), hrController.runPayroll);

// Training
router.get('/training', requirePermission('hr', 'can_view'), hrController.getTraining);
router.post('/training', requirePermission('hr', 'can_create'), hrController.createTraining);

// Performance & Goals
router.get('/performance', requirePermission('hr', 'can_view'), hrController.getPerformance);
router.post('/performance', requirePermission('hr', 'can_create'), hrController.createPerformance);

router.get('/goals', requirePermission('hr', 'can_view'), hrController.getGoals);
router.post('/goals', requirePermission('hr', 'can_create'), hrController.createGoal);

// Policies, Documents, Engagement
router.get('/policies', requirePermission('hr', 'can_view'), hrController.getPolicies);
router.post('/policies', requirePermission('hr', 'can_create'), hrController.createPolicy);

router.get('/documents', requirePermission('hr', 'can_view'), hrController.getDocuments);
router.post('/documents', requirePermission('hr', 'can_create'), hrController.uploadDocument);

router.get('/engagement', requirePermission('hr', 'can_view'), hrController.getEngagement);
router.post('/engagement', requirePermission('hr', 'can_create'), hrController.createEngagement);

export default router;
