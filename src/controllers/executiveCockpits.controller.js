import { ExecutiveCockpitsEngine } from '../services/executiveCockpits.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCeoDashboard = asyncHandler(async (req, res) => {
  const dash = await ExecutiveCockpitsEngine.getCeoDashboard(req.query);
  return ApiResponse.success(res, dash, 'CEO cockpit aggregated successfully');
});

export const getFounderDecisions = asyncHandler(async (req, res) => {
  const dash = await ExecutiveCockpitsEngine.getFounderDecisionDashboard();
  return ApiResponse.success(res, dash, 'Founder decision signals and risk queue fetched');
});

export const executeDecisionAction = asyncHandler(async (req, res) => {
  const updated = await ExecutiveCockpitsEngine.executeFounderDecisionAction(req.params.id, req.body, req.user?._id);
  return ApiResponse.success(res, updated, 'Founder decision executed and audit log recorded');
});

export const getAssistantAgenda = asyncHandler(async (req, res) => {
  const agenda = await ExecutiveCockpitsEngine.getAssistantDashboard(req.user?._id);
  return ApiResponse.success(res, agenda, 'Executive Assistant agenda and daily checklist fetched');
});
