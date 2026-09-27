import * as dashService from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getFounderDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getFounderDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'Founder dashboard retrieved successfully');
});

export const getCeoDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getCeoDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'CEO dashboard retrieved successfully');
});

export const getCroDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getCroDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'CRO dashboard retrieved successfully');
});

export const getCmoDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getCmoDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'CMO dashboard retrieved successfully');
});

export const getCooDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getCooDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'COO dashboard retrieved successfully');
});

export const getCfoDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getCfoDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'CFO dashboard retrieved successfully');
});

export const getChroDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getChroDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'CHRO dashboard retrieved successfully');
});

export const getCtoDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getCtoDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'CTO dashboard retrieved successfully');
});

export const getRndDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await dashService.getRndExecutiveDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'R&D executive dashboard retrieved successfully');
});
