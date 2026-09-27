import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as salesController from '../controllers/sales.controller.js';
import * as extController from '../controllers/extensions.controller.js';

const router = express.Router();

router.use(authenticateUser);

// Channel Partners
router.get('/channel-partners', requirePermission('Quotation', 'can_view'), salesController.listChannelPartners);
router.post('/channel-partners', requirePermission('Quotation', 'can_create'), salesController.createChannelPartner);
router.put('/channel-partners/:id', requirePermission('Quotation', 'can_edit'), salesController.updateChannelPartner);

// Retail POS
router.post('/pos/checkout', requirePermission('Quotation', 'can_create'), salesController.createPosSale);
router.get('/pos/daily-summary', requirePermission('Quotation', 'can_view'), salesController.getDailyRetailSummary);

// Quotations
router.get('/quotations', requirePermission('Quotation', 'can_view'), salesController.listQuotations);
router.post('/quotations', requirePermission('Quotation', 'can_create'), salesController.createQuotation);
router.get('/quotations/:id', requirePermission('Quotation', 'can_view'), salesController.getQuotationById);
router.put('/quotations/:id', requirePermission('Quotation', 'can_edit'), salesController.updateQuotation);
router.post('/quotations/:id/revisions', requirePermission('Quotation', 'can_create'), salesController.createRevision);
router.put('/quotations/:id/approve-discount', requirePermission('Quotation', 'can_approve'), salesController.approveDiscount);
router.put('/quotations/:id/convert-to-order', requirePermission('Quotation', 'can_edit'), salesController.convertToOrder);

// Sales Segments (B2B, Channel, Retail, Inside Sales, Key Accounts)
router.get('/segments/:segment', requirePermission('sales', 'can_view'), extController.getSalesSegmentData);

export default router;
