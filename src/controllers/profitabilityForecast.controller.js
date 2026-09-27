import { ProfitabilityForecastEngine } from '../services/profitabilityForecast.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getComprehensiveProfitability = asyncHandler(async (req, res) => {
  const profit = await ProfitabilityForecastEngine.calculateComprehensiveProfitability(req.query);
  return ApiResponse.success(res, profit, '9-Factor Net Profitability calculated');
});

export const getProductProfitability = asyncHandler(async (req, res) => {
  const products = await ProfitabilityForecastEngine.getProductProfitability();
  return ApiResponse.success(res, products, 'Product margin & profitability analysis fetched');
});

export const getForecasts = asyncHandler(async (req, res) => {
  const forecasts = await ProfitabilityForecastEngine.getBusinessForecasts();
  return ApiResponse.success(res, forecasts, 'Business forecasts & historical actuals fetched');
});
