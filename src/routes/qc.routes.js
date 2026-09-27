import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as qcController from '../controllers/qc.controller.js';

const router = express.Router();
router.use(authenticateUser);

router.get('/dashboard', requirePermission('quality', 'can_view'), qcController.getDashboardMetrics);

// Parameters & Templates
router.get('/parameters', requirePermission('quality', 'can_view'), qcController.listParameters);
router.post('/parameters', requirePermission('quality', 'can_create'), qcController.createParameter);
router.get('/templates', requirePermission('quality', 'can_view'), qcController.listTemplates);
router.post('/templates', requirePermission('quality', 'can_create'), qcController.createTemplate);

// Inspections
router.get('/inspections', requirePermission('quality', 'can_view'), qcController.listInspections);
router.post('/inspections', requirePermission('quality', 'can_create'), qcController.createInspection);
router.get('/inspections/:id', requirePermission('quality', 'can_view'), qcController.getInspectionById);

// Rework
router.get('/rework', requirePermission('quality', 'can_view'), qcController.listReworkRecords);

export default router;
