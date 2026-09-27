import * as healthService from '../services/health.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const checkHealth = asyncHandler(async (req, res) => {
  const healthData = await healthService.getHealthStatus();
  return ApiResponse.success(res, healthData, 'Health check passed', 200);
});
