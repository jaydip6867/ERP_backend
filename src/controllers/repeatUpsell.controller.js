import { RepeatUpsellEngine } from '../services/repeatUpsell.service.js';
import { RepeatOrder } from '../models/repeatOrder.model.js';
import { UpsellOpportunity } from '../models/upsellOpportunity.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRepeatDashboard = asyncHandler(async (req, res) => {
  const dash = await RepeatUpsellEngine.getRepeatOrdersDashboard();
  return ApiResponse.success(res, dash, 'Repeat order replenishment dashboard fetched');
});

export const scheduleRepeatOrders = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const schedules = await RepeatUpsellEngine.scheduleRepeatOrderFromDelivered(orderId, req.user?._id);
  return ApiResponse.created(res, schedules, 'Repeat order schedules generated');
});

export const updateRepeatOrderStatus = asyncHandler(async (req, res) => {
  const item = await RepeatOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  return ApiResponse.success(res, item, 'Repeat order status updated');
});

export const getUpsellDashboard = asyncHandler(async (req, res) => {
  const dash = await RepeatUpsellEngine.getUpsellDashboard();
  return ApiResponse.success(res, dash, 'Upsell & Cross-sell pipeline fetched');
});

export const generateUpsell = asyncHandler(async (req, res) => {
  const { customerId } = req.body;
  const opp = await RepeatUpsellEngine.generateUpsellOpportunities(customerId, req.user?._id);
  return ApiResponse.created(res, opp, 'Upsell opportunity generated');
});

export const updateUpsellStatus = asyncHandler(async (req, res) => {
  const opp = await UpsellOpportunity.findByIdAndUpdate(req.params.id, req.body, { new: true });
  return ApiResponse.success(res, opp, 'Upsell opportunity updated');
});
