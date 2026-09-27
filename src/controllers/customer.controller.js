import { customerService } from '../services/customer.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const result = await customerService.listCustomers(req.query, scopeFilter);
  return ApiResponse.paginated(res, result.items, result.pagination, 'Customers fetched successfully');
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  return ApiResponse.success(res, customer, 'Customer fetched successfully');
});

export const getCustomer360 = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomer360(req.params.id);
  return ApiResponse.success(res, data, 'Customer 360 profile fetched successfully');
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user, req);
  return ApiResponse.created(res, customer, 'Customer created successfully');
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, customer, 'Customer updated successfully');
});

export const approveCredit = asyncHandler(async (req, res) => {
  const customer = await customerService.approveCredit(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, customer, 'Credit limits updated successfully');
});

export const mergeDuplicates = asyncHandler(async (req, res) => {
  const result = await customerService.mergeDuplicates(req.body, req.user, req);
  return ApiResponse.success(res, result.targetCustomer, result.message);
});

// Contacts
export const addContact = asyncHandler(async (req, res) => {
  const contact = await customerService.addContact(req.params.id, req.body, req.user);
  return ApiResponse.created(res, contact, 'Contact added successfully');
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await customerService.updateContact(req.params.contactId, req.body);
  return ApiResponse.success(res, contact, 'Contact updated successfully');
});

export const deleteContact = asyncHandler(async (req, res) => {
  const result = await customerService.deleteContact(req.params.contactId);
  return ApiResponse.success(res, null, result.message);
});

// Addresses
export const addAddress = asyncHandler(async (req, res) => {
  const address = await customerService.addAddress(req.params.id, req.body, req.user);
  return ApiResponse.created(res, address, 'Address added successfully');
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await customerService.updateAddress(req.params.addressId, req.body);
  return ApiResponse.success(res, address, 'Address updated successfully');
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const result = await customerService.deleteAddress(req.params.addressId);
  return ApiResponse.success(res, null, result.message);
});

// Documents
export const addDocument = asyncHandler(async (req, res) => {
  const doc = await customerService.addDocument(req.params.id, req.body, req.user);
  return ApiResponse.created(res, doc, 'Document uploaded successfully');
});

export const verifyDocument = asyncHandler(async (req, res) => {
  const doc = await customerService.verifyDocument(req.params.docId, req.body, req.user);
  return ApiResponse.success(res, doc, 'Document verification updated');
});

// Interactions
export const addInteraction = asyncHandler(async (req, res) => {
  const interaction = await customerService.addInteraction(req.params.id, req.body, req.user);
  return ApiResponse.created(res, interaction, 'Interaction recorded successfully');
});
