import * as adminService from '../services/admin.service.js';
import * as numberSeriesService from '../services/numberSeries.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Users
export const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  return ApiResponse.paginated(res, result.users, { page: result.page, limit: result.limit, total: result.total });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  return ApiResponse.success(res, { user });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await adminService.createUser(req.body, req.user, req);
  return ApiResponse.created(res, { user }, 'User created successfully');
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { user }, 'User updated successfully');
});

// Company
export const getCompanyProfile = asyncHandler(async (req, res) => {
  const company = await adminService.getCompanyProfile();
  return ApiResponse.success(res, { company });
});

export const updateCompanyProfile = asyncHandler(async (req, res) => {
  const company = await adminService.updateCompanyProfile(req.body, req.user, req);
  return ApiResponse.success(res, { company }, 'Company profile updated successfully');
});

// Branches
export const getBranches = asyncHandler(async (req, res) => {
  const branches = await adminService.getBranches(req.query);
  return ApiResponse.success(res, { branches });
});

export const createBranch = asyncHandler(async (req, res) => {
  const branch = await adminService.createBranch(req.body, req.user, req);
  return ApiResponse.created(res, { branch }, 'Branch created successfully');
});

export const updateBranch = asyncHandler(async (req, res) => {
  const branch = await adminService.updateBranch(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { branch }, 'Branch updated successfully');
});

// Warehouses
export const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await adminService.getWarehouses(req.query);
  return ApiResponse.success(res, { warehouses });
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await adminService.createWarehouse(req.body, req.user, req);
  return ApiResponse.created(res, { warehouse }, 'Warehouse created successfully');
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await adminService.updateWarehouse(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { warehouse }, 'Warehouse updated successfully');
});

// Number Series
export const getAllNumberSeries = asyncHandler(async (req, res) => {
  const series = await adminService.getAllNumberSeries();
  return ApiResponse.success(res, { series });
});

export const updateNumberSeries = asyncHandler(async (req, res) => {
  const series = await adminService.updateNumberSeries(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { series }, 'Number series updated successfully');
});

export const previewNextNumber = asyncHandler(async (req, res) => {
  const preview = await numberSeriesService.getNextNumber(req.params.module);
  return ApiResponse.success(res, { module: req.params.module, generatedNumber: preview });
});

// Master Data
export const getMasterData = asyncHandler(async (req, res) => {
  const masterData = await adminService.getMasterData(req.query);
  return ApiResponse.success(res, { masterData });
});

export const createMasterData = asyncHandler(async (req, res) => {
  const master = await adminService.createMasterData(req.body, req.user, req);
  return ApiResponse.created(res, { master }, 'Master data option created successfully');
});

export const updateMasterData = asyncHandler(async (req, res) => {
  const master = await adminService.updateMasterData(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { master }, 'Master data option updated successfully');
});

// System Settings
export const getSystemSettings = asyncHandler(async (req, res) => {
  const result = await adminService.getSystemSettings(req.query.group);
  return ApiResponse.success(res, result);
});

export const updateSystemSettings = asyncHandler(async (req, res) => {
  const result = await adminService.updateSystemSettings(req.body, req.user, req);
  return ApiResponse.success(res, result, 'System settings saved successfully');
});

// Audit & Login History
export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await adminService.getAuditLogs(req.query);
  return ApiResponse.paginated(res, result.logs, { page: result.page, limit: result.limit, total: result.total });
});

export const getLoginHistory = asyncHandler(async (req, res) => {
  const result = await adminService.getLoginHistory(req.query);
  return ApiResponse.paginated(res, result.history, { page: result.page, limit: result.limit, total: result.total });
});
