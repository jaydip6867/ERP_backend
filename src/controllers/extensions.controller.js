import * as extService from '../services/extensions.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Operations
export const getOperationsDashboard = asyncHandler(async (req, res) => {
  const data = await extService.getOperationsDashboard();
  return ApiResponse.success(res, data);
});

export const getPrintingJobs = asyncHandler(async (req, res) => {
  const jobs = await extService.getPrintingJobs(req.query);
  return ApiResponse.success(res, { jobs });
});

export const createPrintingJob = asyncHandler(async (req, res) => {
  const job = await extService.createPrintingJob(req.body);
  return ApiResponse.created(res, { job }, 'Printing job queued');
});

export const getEmbroideryJobs = asyncHandler(async (req, res) => {
  const jobs = await extService.getEmbroideryJobs(req.query);
  return ApiResponse.success(res, { jobs });
});

export const createEmbroideryJob = asyncHandler(async (req, res) => {
  const job = await extService.createEmbroideryJob(req.body);
  return ApiResponse.created(res, { job }, 'Embroidery job queued');
});

export const getPackingJobs = asyncHandler(async (req, res) => {
  const jobs = await extService.getPackingJobs(req.query);
  return ApiResponse.success(res, { jobs });
});

export const createPackingJob = asyncHandler(async (req, res) => {
  const job = await extService.createPackingJob(req.body);
  return ApiResponse.created(res, { job }, 'Packing job registered');
});

export const getLogisticsJobs = asyncHandler(async (req, res) => {
  const jobs = await extService.getLogisticsJobs(req.query);
  return ApiResponse.success(res, { jobs });
});

export const createLogisticsJob = asyncHandler(async (req, res) => {
  const job = await extService.createLogisticsJob(req.body);
  return ApiResponse.created(res, { job }, 'Consignment dispatched');
});

export const getSupplyChainPlans = asyncHandler(async (req, res) => {
  const plans = await extService.getSupplyChainPlans();
  return ApiResponse.success(res, { plans });
});

export const createSupplyChainPlan = asyncHandler(async (req, res) => {
  const plan = await extService.createSupplyChainPlan(req.body);
  return ApiResponse.created(res, { plan });
});

export const getMerchandisingProducts = asyncHandler(async (req, res) => {
  const products = await extService.getMerchandisingProducts(req.query);
  return ApiResponse.success(res, { products });
});

export const getVendorManagementData = asyncHandler(async (req, res) => {
  const vendors = await extService.getVendorManagementData();
  return ApiResponse.success(res, { vendors });
});

// Marketing
export const getMarketingAssets = asyncHandler(async (req, res) => {
  const assets = await extService.getMarketingAssets(req.query);
  return ApiResponse.success(res, { assets });
});

export const createMarketingAsset = asyncHandler(async (req, res) => {
  const asset = await extService.createMarketingAsset(req.body);
  return ApiResponse.created(res, { asset });
});

export const getContentItems = asyncHandler(async (req, res) => {
  const items = await extService.getContentItems(req.query);
  return ApiResponse.success(res, { items });
});

export const createContentItem = asyncHandler(async (req, res) => {
  const item = await extService.createContentItem(req.body);
  return ApiResponse.created(res, { item });
});

export const getCreativeRequests = asyncHandler(async (req, res) => {
  const requests = await extService.getCreativeRequests(req.query);
  return ApiResponse.success(res, { requests });
});

export const createCreativeRequest = asyncHandler(async (req, res) => {
  const request = await extService.createCreativeRequest(req.body);
  return ApiResponse.created(res, { request });
});

export const getPhysicalMarketing = asyncHandler(async (req, res) => {
  const activities = await extService.getPhysicalMarketing(req.query);
  return ApiResponse.success(res, { activities });
});

export const createPhysicalMarketing = asyncHandler(async (req, res) => {
  const activity = await extService.createPhysicalMarketing(req.body);
  return ApiResponse.created(res, { activity });
});

// Sales Segment
export const getSalesSegmentData = asyncHandler(async (req, res) => {
  const data = await extService.getSalesSegmentData(req.params.segment);
  return ApiResponse.success(res, data);
});

// Finance Extensions
export const getCostCenters = asyncHandler(async (req, res) => {
  const costCenters = await extService.getCostCenters();
  return ApiResponse.success(res, { costCenters });
});

export const createCostCenter = asyncHandler(async (req, res) => {
  const costCenter = await extService.createCostCenter(req.body);
  return ApiResponse.created(res, { costCenter });
});

export const getManagementReports = asyncHandler(async (req, res) => {
  const reports = await extService.getManagementReports(req.query);
  return ApiResponse.success(res, { reports });
});

export const createManagementReport = asyncHandler(async (req, res) => {
  const report = await extService.createManagementReport(req.body);
  return ApiResponse.created(res, { report });
});
