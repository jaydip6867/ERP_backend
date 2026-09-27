import { leadService } from '../services/lead.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await leadService.getDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'Lead dashboard data fetched successfully');
});

export const listLeads = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const result = await leadService.listLeads(req.query, scopeFilter);
  return ApiResponse.paginated(res, result.items, result.pagination, 'Leads fetched successfully');
});

export const getKanban = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const kanban = await leadService.getKanban(scopeFilter);
  return ApiResponse.success(res, kanban, 'Kanban board fetched successfully');
});

export const getLeadById = asyncHandler(async (req, res) => {
  const data = await leadService.getLeadById(req.params.id);
  return ApiResponse.success(res, data, 'Lead details fetched successfully');
});

export const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user, req);
  return ApiResponse.created(res, lead, 'Lead created successfully');
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, lead, 'Lead updated successfully');
});

export const updateStage = asyncHandler(async (req, res) => {
  const lead = await leadService.updateStage(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, lead, 'Pipeline stage updated successfully');
});

export const convertToCustomer = asyncHandler(async (req, res) => {
  const result = await leadService.convertToCustomer(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, result, 'Lead successfully converted to customer');
});

// Followups
export const listFollowups = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const result = await leadService.listFollowups(req.query, scopeFilter);
  return ApiResponse.paginated(res, result.items, result.pagination, 'Followups fetched successfully');
});

export const createFollowup = asyncHandler(async (req, res) => {
  const followup = await leadService.createFollowup(req.body, req.user);
  return ApiResponse.created(res, followup, 'Followup scheduled successfully');
});

export const completeFollowup = asyncHandler(async (req, res) => {
  const result = await leadService.completeFollowup(req.params.id, req.body, req.user);
  return ApiResponse.success(res, result, 'Followup marked as completed');
});
