import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as taxController from '../controllers/tax.controller.js';

const router = express.Router();
router.use(authenticateUser);

router.get('/rates', requirePermission('finance', 'can_view'), taxController.getTaxRates);
router.post('/rates', requirePermission('finance', 'can_create'), taxController.createTaxRate);
router.put('/rates/:id', requirePermission('finance', 'can_edit'), taxController.updateTaxRate);

// GST Reports
router.get('/gstr-1', requirePermission('finance', 'can_export'), taxController.getGstr1);
router.get('/gstr-3b', requirePermission('finance', 'can_export'), taxController.getGstr3b);
router.get('/itc-register', requirePermission('finance', 'can_view'), taxController.getItcRegister);
router.get('/ledger', requirePermission('finance', 'can_view'), taxController.getTaxLedgerSummary);

export default router;
