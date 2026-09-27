import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as purchaseController from '../controllers/purchase.controller.js';

const router = express.Router();
router.use(authenticateUser);

// Suppliers
router.get('/suppliers', requirePermission('procurement', 'can_view'), purchaseController.listSuppliers);
router.post('/suppliers', requirePermission('procurement', 'can_create'), purchaseController.createSupplier);
router.get('/suppliers/:id', requirePermission('procurement', 'can_view'), purchaseController.getSupplierById);
router.put('/suppliers/:id', requirePermission('procurement', 'can_edit'), purchaseController.updateSupplier);

// Requisitions
router.get('/requisitions', requirePermission('procurement', 'can_view'), purchaseController.listRequisitions);
router.post('/requisitions', requirePermission('procurement', 'can_create'), purchaseController.createRequisition);
router.put('/requisitions/:id/approve', requirePermission('procurement', 'can_approve'), purchaseController.approveRequisition);

// Orders
router.get('/orders', requirePermission('procurement', 'can_view'), purchaseController.listOrders);
router.post('/orders', requirePermission('procurement', 'can_create'), purchaseController.createOrder);
router.get('/orders/:id', requirePermission('procurement', 'can_view'), purchaseController.getOrderById);

// GRN
router.get('/grns', requirePermission('procurement', 'can_view'), purchaseController.listGrns);
router.post('/grns', requirePermission('procurement', 'can_create'), purchaseController.createGrn);
router.get('/grns/:id', requirePermission('procurement', 'can_view'), purchaseController.getGrnById);
router.put('/grns/:id/post-to-stock', requirePermission('procurement', 'can_approve'), purchaseController.postGrnToStock);

// Invoices
router.get('/invoices', requirePermission('procurement', 'can_view'), purchaseController.listInvoices);
router.post('/invoices', requirePermission('procurement', 'can_create'), purchaseController.createInvoice);

// Returns
router.get('/returns', requirePermission('procurement', 'can_view'), purchaseController.listReturns);
router.post('/returns', requirePermission('procurement', 'can_create'), purchaseController.createReturn);

export default router;
