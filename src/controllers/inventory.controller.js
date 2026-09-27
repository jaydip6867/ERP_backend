import { InventoryService } from '../services/inventory.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const metrics = await InventoryService.getDashboardMetrics();
  return ApiResponse.success(res, metrics, 'Inventory dashboard metrics fetched successfully');
});

export const getStockSummary = asyncHandler(async (req, res) => {
  const result = await InventoryService.getStockSummary(req.query);
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Stock summary fetched successfully');
});

export const getStockLedger = asyncHandler(async (req, res) => {
  const result = await InventoryService.getStockLedger(req.query);
  return ApiResponse.paginated(res, result.entries, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Stock ledger entries fetched successfully');
});

export const listTransfers = asyncHandler(async (req, res) => {
  const result = await InventoryService.getTransfers(req.query);
  return ApiResponse.paginated(res, result.transfers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Stock transfers fetched successfully');
});

export const createTransfer = asyncHandler(async (req, res) => {
  const transfer = await InventoryService.createTransfer(req.body, req.user?._id);
  return ApiResponse.created(res, transfer, 'Stock transfer created successfully');
});

export const completeTransfer = asyncHandler(async (req, res) => {
  const transfer = await InventoryService.completeTransfer(req.params.id, req.user?._id);
  return ApiResponse.success(res, transfer, 'Stock transfer completed and posted');
});

export const listAdjustments = asyncHandler(async (req, res) => {
  const result = await InventoryService.getAdjustments(req.query);
  return ApiResponse.paginated(res, result.adjustments, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Stock adjustments fetched successfully');
});

export const createAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await InventoryService.createAdjustment(req.body, req.user?._id);
  return ApiResponse.created(res, adjustment, 'Stock adjustment created successfully');
});

export const approveAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await InventoryService.approveAdjustment(req.params.id, req.user?._id);
  return ApiResponse.success(res, adjustment, 'Stock adjustment approved and posted');
});

export const listBatches = asyncHandler(async (req, res) => {
  const result = await InventoryService.getBatches(req.query);
  return ApiResponse.paginated(res, result.batches, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Batches fetched successfully');
});

export const updateBatchStatus = asyncHandler(async (req, res) => {
  const batch = await InventoryService.updateBatchStatus(
    req.params.id,
    req.body.status,
    req.body.remarks
  );
  return ApiResponse.success(res, batch, 'Batch status updated successfully');
});

export const listReservations = asyncHandler(async (req, res) => {
  const result = await InventoryService.getReservations(req.query);
  return ApiResponse.paginated(res, result.reservations, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Stock reservations fetched successfully');
});

export const listPhysicalCounts = asyncHandler(async (req, res) => {
  const result = await InventoryService.getPhysicalCounts(req.query);
  return ApiResponse.paginated(res, result.counts, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Physical counts fetched successfully');
});
