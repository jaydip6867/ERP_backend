import { ProductionService } from '../services/production.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const metrics = await ProductionService.getDashboardMetrics();
  return ApiResponse.success(res, metrics, 'Production dashboard metrics fetched');
});

// Work Orders
export const listWorkOrders = asyncHandler(async (req, res) => {
  const result = await ProductionService.getWorkOrders(req.query);
  return ApiResponse.paginated(res, result.orders, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Work orders fetched successfully');
});

export const getWorkOrderById = asyncHandler(async (req, res) => {
  const wo = await ProductionService.getWorkOrderById(req.params.id);
  return ApiResponse.success(res, wo, 'Work order fetched successfully');
});

export const createWorkOrder = asyncHandler(async (req, res) => {
  const wo = await ProductionService.createWorkOrder(req.body, req.user?._id);
  return ApiResponse.created(res, wo, 'Work order created successfully');
});

export const checkMaterialAvailability = asyncHandler(async (req, res) => {
  const result = await ProductionService.checkMaterialAvailability(
    req.query.bom_id,
    Number(req.query.planned_qty || 1),
    req.query.warehouse_id
  );
  return ApiResponse.success(res, result, 'Material availability checked');
});

export const receiveFinishedGoods = asyncHandler(async (req, res) => {
  const result = await ProductionService.receiveFinishedGoods(req.params.id, req.body, req.user?._id);
  return ApiResponse.success(res, result, 'Finished goods received into inventory');
});

// Material Issues
export const listMaterialIssues = asyncHandler(async (req, res) => {
  const result = await ProductionService.getMaterialIssues(req.query);
  return ApiResponse.paginated(res, result.issues, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Material issues fetched successfully');
});

export const issueMaterials = asyncHandler(async (req, res) => {
  const issue = await ProductionService.issueMaterials(req.body, req.user?._id);
  return ApiResponse.created(res, issue, 'Materials issued to production shop floor');
});

// Production Logs
export const listProductionLogs = asyncHandler(async (req, res) => {
  const result = await ProductionService.getProductionLogs(req.query);
  return ApiResponse.paginated(res, result.logs, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Production logs fetched successfully');
});

export const createProductionLog = asyncHandler(async (req, res) => {
  const log = await ProductionService.createProductionLog(req.body, req.user?._id);
  return ApiResponse.created(res, log, 'Production log recorded successfully');
});

// Scrap & Costing
export const listScrapRecords = asyncHandler(async (req, res) => {
  const result = await ProductionService.getScrapRecords(req.query);
  return ApiResponse.paginated(res, result.records, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Scrap records fetched successfully');
});

export const createScrapRecord = asyncHandler(async (req, res) => {
  const record = await ProductionService.createScrapRecord(req.body, req.user?._id);
  return ApiResponse.created(res, record, 'Scrap record logged successfully');
});

export const getCosting = asyncHandler(async (req, res) => {
  const cost = await ProductionService.getCosting(req.params.id);
  return ApiResponse.success(res, cost, 'Production cost breakdown fetched');
});
