import { PurchaseService } from '../services/purchase.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Suppliers
export const listSuppliers = asyncHandler(async (req, res) => {
  const result = await PurchaseService.getSuppliers(req.query);
  return ApiResponse.paginated(res, result.suppliers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Suppliers fetched successfully');
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await PurchaseService.getSupplierById(req.params.id);
  return ApiResponse.success(res, supplier, 'Supplier fetched successfully');
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await PurchaseService.createSupplier(req.body, req.user?._id);
  return ApiResponse.created(res, supplier, 'Supplier created successfully');
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await PurchaseService.updateSupplier(req.params.id, req.body, req.user?._id);
  return ApiResponse.success(res, supplier, 'Supplier updated successfully');
});

// Requisitions
export const listRequisitions = asyncHandler(async (req, res) => {
  const result = await PurchaseService.getRequisitions(req.query);
  return ApiResponse.paginated(res, result.requisitions, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Purchase requisitions fetched successfully');
});

export const createRequisition = asyncHandler(async (req, res) => {
  const pr = await PurchaseService.createRequisition(req.body, req.user?._id);
  return ApiResponse.created(res, pr, 'Purchase requisition created successfully');
});

export const approveRequisition = asyncHandler(async (req, res) => {
  const pr = await PurchaseService.approveRequisition(
    req.params.id,
    { approve: req.body.approve, remarks: req.body.remarks },
    req.user?._id
  );
  return ApiResponse.success(res, pr, 'Purchase requisition status updated');
});

// Orders
export const listOrders = asyncHandler(async (req, res) => {
  const result = await PurchaseService.getOrders(req.query);
  return ApiResponse.paginated(res, result.orders, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Purchase orders fetched successfully');
});

export const getOrderById = asyncHandler(async (req, res) => {
  const po = await PurchaseService.getOrderById(req.params.id);
  return ApiResponse.success(res, po, 'Purchase order fetched successfully');
});

export const createOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseService.createOrder(req.body, req.user?._id);
  return ApiResponse.created(res, po, 'Purchase order created successfully');
});

// GRN
export const listGrns = asyncHandler(async (req, res) => {
  const result = await PurchaseService.getGrns(req.query);
  return ApiResponse.paginated(res, result.grns, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'GRNs fetched successfully');
});

export const getGrnById = asyncHandler(async (req, res) => {
  const grn = await PurchaseService.getGrnById(req.params.id);
  return ApiResponse.success(res, grn, 'GRN fetched successfully');
});

export const createGrn = asyncHandler(async (req, res) => {
  const grn = await PurchaseService.createGrn(req.body, req.user?._id);
  return ApiResponse.created(res, grn, 'GRN created successfully');
});

export const postGrnToStock = asyncHandler(async (req, res) => {
  const grn = await PurchaseService.postGrnToStock(req.params.id, req.user?._id);
  return ApiResponse.success(res, grn, 'GRN accepted goods posted to inventory stock');
});

// Invoices
export const listInvoices = asyncHandler(async (req, res) => {
  const result = await PurchaseService.getInvoices(req.query);
  return ApiResponse.paginated(res, result.invoices, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Purchase invoices fetched successfully');
});

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await PurchaseService.createInvoice(req.body, req.user?._id);
  return ApiResponse.created(res, invoice, 'Purchase invoice booked successfully');
});

// Returns
export const listReturns = asyncHandler(async (req, res) => {
  const result = await PurchaseService.getReturns(req.query);
  return ApiResponse.paginated(res, result.returns, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Purchase returns fetched successfully');
});

export const createReturn = asyncHandler(async (req, res) => {
  const pret = await PurchaseService.createReturn(req.body, req.user?._id);
  return ApiResponse.created(res, pret, 'Purchase return processed successfully');
});
