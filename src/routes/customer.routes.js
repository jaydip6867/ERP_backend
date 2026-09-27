import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as customerController from '../controllers/customer.controller.js';

const router = express.Router();

router.use(authenticateUser);

// List and 360
router.get('/', requirePermission('Customer', 'can_view'), customerController.listCustomers);
router.post('/', requirePermission('Customer', 'can_create'), customerController.createCustomer);
router.post('/merge-duplicates', requirePermission('Customer', 'can_edit'), customerController.mergeDuplicates);

router.get('/:id', requirePermission('Customer', 'can_view'), customerController.getCustomerById);
router.get('/:id/360', requirePermission('Customer', 'can_view'), customerController.getCustomer360);
router.put('/:id', requirePermission('Customer', 'can_edit'), customerController.updateCustomer);
router.put('/:id/credit-approval', requirePermission('Customer', 'can_approve'), customerController.approveCredit);

// Contacts
router.post('/:id/contacts', requirePermission('Customer', 'can_edit'), customerController.addContact);
router.put('/:id/contacts/:contactId', requirePermission('Customer', 'can_edit'), customerController.updateContact);
router.delete('/:id/contacts/:contactId', requirePermission('Customer', 'can_edit'), customerController.deleteContact);

// Addresses
router.post('/:id/addresses', requirePermission('Customer', 'can_edit'), customerController.addAddress);
router.put('/:id/addresses/:addressId', requirePermission('Customer', 'can_edit'), customerController.updateAddress);
router.delete('/:id/addresses/:addressId', requirePermission('Customer', 'can_edit'), customerController.deleteAddress);

// Documents
router.post('/:id/documents', requirePermission('Customer', 'can_edit'), customerController.addDocument);
router.put('/:id/documents/:docId/verify', requirePermission('Customer', 'can_approve'), customerController.verifyDocument);

// Interactions
router.post('/:id/interactions', requirePermission('Customer', 'can_edit'), customerController.addInteraction);

export default router;
