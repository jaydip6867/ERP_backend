import * as techService from '../services/technology.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTechDashboard = asyncHandler(async (req, res) => {
  const data = await techService.getTechDashboard();
  return ApiResponse.success(res, data, 'Technology dashboard metrics retrieved successfully');
});

export const getIntegrations = asyncHandler(async (req, res) => {
  const integrations = await techService.getIntegrations(req.query);
  return ApiResponse.success(res, { integrations }, 'Integrations retrieved successfully');
});

export const createIntegration = asyncHandler(async (req, res) => {
  const integration = await techService.createIntegration(req.body, req.user, req);
  return ApiResponse.created(res, { integration }, 'Integration configured successfully');
});

export const updateIntegration = asyncHandler(async (req, res) => {
  const integration = await techService.updateIntegration(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { integration }, 'Integration updated successfully');
});

export const testIntegration = asyncHandler(async (req, res) => {
  const result = await techService.testIntegration(req.params.id, req.user, req);
  return ApiResponse.success(res, result, 'Integration test completed');
});

export const getAutomationRules = asyncHandler(async (req, res) => {
  const rules = await techService.getAutomationRules(req.query);
  return ApiResponse.success(res, { rules }, 'Automation rules retrieved successfully');
});

export const createAutomationRule = asyncHandler(async (req, res) => {
  const rule = await techService.createAutomationRule(req.body, req.user, req);
  return ApiResponse.created(res, { rule }, 'Automation rule created successfully');
});

export const updateAutomationRule = asyncHandler(async (req, res) => {
  const rule = await techService.updateAutomationRule(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { rule }, 'Automation rule updated successfully');
});

export const runAutomationRule = asyncHandler(async (req, res) => {
  const result = await techService.runAutomationRule(req.params.id, req.user, req);
  return ApiResponse.success(res, result, 'Automation rule executed successfully');
});

export const getAutomationRuns = asyncHandler(async (req, res) => {
  const runs = await techService.getAutomationRuns(req.query);
  return ApiResponse.success(res, { runs }, 'Automation run logs retrieved successfully');
});

export const getBiReports = asyncHandler(async (req, res) => {
  const reports = await techService.getBiReports(req.query);
  return ApiResponse.success(res, { reports }, 'BI reports retrieved successfully');
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const health = await techService.getSystemHealth();
  return ApiResponse.success(res, health, 'System health diagnostics retrieved successfully');
});

export const getWebhooks = asyncHandler(async (req, res) => {
  const webhooks = await techService.getWebhooks(req.query);
  return ApiResponse.success(res, { webhooks }, 'Webhooks retrieved successfully');
});

export const getPortalUsers = asyncHandler(async (req, res) => {
  const portalUsers = await techService.getPortalUsers(req.query);
  return ApiResponse.success(res, { portalUsers }, 'Customer portal users retrieved successfully');
});
