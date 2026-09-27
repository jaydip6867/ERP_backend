import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as invoiceController from '../controllers/invoice.controller.js';

const router = express.Router();
router.use(authenticateUser);

router.get('/dashboard', requirePermission('finance', 'can_view'), invoiceController.getDashboardMetrics);
router.get('/ageing', requirePermission('finance', 'can_view'), invoiceController.getInvoiceAgeing);

// Invoices
router.get('/', requirePermission('finance', 'can_view'), invoiceController.listInvoices);
router.post('/', requirePermission('finance', 'can_create'), invoiceController.createInvoice);
router.get('/:id', requirePermission('finance', 'can_view'), invoiceController.getInvoiceById);
router.post('/:id/e-invoice', requirePermission('finance', 'can_edit'), invoiceController.generateEInvoice);
router.post('/:id/e-way-bill', requirePermission('finance', 'can_edit'), invoiceController.generateEWayBill);
router.post('/:id/payments', requirePermission('finance', 'can_create'), invoiceController.recordPayment);

// Credit/Debit Notes
router.get('/notes/list', requirePermission('finance', 'can_view'), invoiceController.listCreditDebitNotes);
router.post('/notes', requirePermission('finance', 'can_create'), invoiceController.createCreditDebitNote);

export default router;
