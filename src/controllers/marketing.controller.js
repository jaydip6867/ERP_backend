import { MarketingService } from '../services/marketing.service.js';
import { MarketingCampaign } from '../models/marketingCampaign.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMarketingDashboard = asyncHandler(async (req, res) => {
  const dash = await MarketingService.getMarketingDashboard();
  return ApiResponse.success(res, dash, 'Marketing campaigns and attribution analytics fetched');
});

export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await MarketingCampaign.find().sort({ createdAt: -1 });
  return ApiResponse.success(res, campaigns, 'Campaigns fetched');
});

export const createCampaign = asyncHandler(async (req, res) => {
  const code = (req.body.campaign_code || `CMP-${Date.now().toString().slice(-4)}`).toUpperCase().trim();
  const campaign = await MarketingCampaign.create({ ...req.body, campaign_code: code, created_by: req.user?._id });
  return ApiResponse.created(res, campaign, 'Marketing campaign created');
});

export const getCampaignPerformance = asyncHandler(async (req, res) => {
  const perf = await MarketingService.getCampaignPerformance(req.params.id);
  return ApiResponse.success(res, perf, 'Campaign ROI & attribution breakdown fetched');
});

export const addCampaignSpend = asyncHandler(async (req, res) => {
  const campaign = await MarketingCampaign.findById(req.params.id);
  if (!campaign) return ApiResponse.notFound(res, 'Campaign not found');

  campaign.spends.push(req.body);
  campaign.total_spend += req.body.amount || 0;
  await campaign.save();

  return ApiResponse.created(res, campaign, 'Campaign spend logged');
});
