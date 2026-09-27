import * as orgService from '../services/organization.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getOrganizationTree = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await orgService.getOrganizationTree(scopeFilter);
  return ApiResponse.success(res, data, 'Organization hierarchy tree retrieved successfully');
});

export const getDepartments = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const departments = await orgService.getDepartments(req.query, scopeFilter);
  return ApiResponse.success(res, { departments }, 'Departments retrieved successfully');
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await orgService.createDepartment(req.body, req.user, req);
  return ApiResponse.created(res, { department }, 'Department created successfully');
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await orgService.updateDepartment(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { department }, 'Department updated successfully');
});

export const getPositions = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const positions = await orgService.getPositions(req.query, scopeFilter);
  return ApiResponse.success(res, { positions }, 'Positions retrieved successfully');
});

export const createPosition = asyncHandler(async (req, res) => {
  const position = await orgService.createPosition(req.body, req.user, req);
  return ApiResponse.created(res, { position }, 'Position created successfully');
});

export const updatePosition = asyncHandler(async (req, res) => {
  const position = await orgService.updatePosition(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { position }, 'Position updated successfully');
});
