import { QcService } from '../services/qc.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const metrics = await QcService.getDashboardMetrics();
  return ApiResponse.success(res, metrics, 'QC dashboard metrics fetched');
});

// Parameters
export const listParameters = asyncHandler(async (req, res) => {
  const params = await QcService.getParameters(req.query);
  return ApiResponse.success(res, params, 'QC parameters fetched');
});

export const createParameter = asyncHandler(async (req, res) => {
  const param = await QcService.createParameter(req.body, req.user?._id);
  return ApiResponse.created(res, param, 'QC parameter created');
});

// Templates
export const listTemplates = asyncHandler(async (req, res) => {
  const templates = await QcService.getTemplates(req.query);
  return ApiResponse.success(res, templates, 'QC templates fetched');
});

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await QcService.createTemplate(req.body, req.user?._id);
  return ApiResponse.created(res, template, 'QC template created');
});

// Inspections
export const listInspections = asyncHandler(async (req, res) => {
  const result = await QcService.getInspections(req.query);
  return ApiResponse.paginated(res, result.inspections, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'QC inspections fetched successfully');
});

export const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await QcService.getInspectionById(req.params.id);
  return ApiResponse.success(res, inspection, 'QC inspection details fetched');
});

export const createInspection = asyncHandler(async (req, res) => {
  const inspection = await QcService.createInspection(req.body, req.user?._id);
  return ApiResponse.created(res, inspection, 'QC inspection recorded successfully');
});

// Rework Records
export const listReworkRecords = asyncHandler(async (req, res) => {
  const result = await QcService.getReworkRecords(req.query);
  return ApiResponse.paginated(res, result.records, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Rework records fetched successfully');
});
