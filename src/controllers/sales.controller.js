import { salesService } from '../services/sales.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listQuotations = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const result = await salesService.listQuotations(req.query, scopeFilter);
  return ApiResponse.paginated(res, result.items, result.pagination, 'Quotations fetched successfully');
});

export const getQuotationById = asyncHandler(async (req, res) => {
  const quotation = await salesService.getQuotationById(req.params.id);
  return ApiResponse.success(res, quotation, 'Quotation fetched successfully');
});

export const createQuotation = asyncHandler(async (req, res) => {
  const quotation = await salesService.createQuotation(req.body, req.user, req);
  return ApiResponse.created(res, quotation, 'Quotation created successfully');
});

export const updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await salesService.updateQuotation(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, quotation, 'Quotation updated successfully');
});

export const createRevision = asyncHandler(async (req, res) => {
  const revision = await salesService.createRevision(req.params.id, req.body, req.user, req);
  return ApiResponse.created(res, revision, 'Quotation revision created successfully');
});

export const approveDiscount = asyncHandler(async (req, res) => {
  const quotation = await salesService.approveDiscount(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, quotation, 'Discount approval status updated');
});

export const convertToOrder = asyncHandler(async (req, res) => {
  const result = await salesService.convertToOrder(req.params.id, req.user, req);
  return ApiResponse.success(res, result.quotation, result.message);
});

// Channel Partners
export const listChannelPartners = asyncHandler(async (req, res) => {
  const partners = await salesService.listChannelPartners();
  return ApiResponse.success(res, partners, 'Channel partners fetched successfully');
});

export const createChannelPartner = asyncHandler(async (req, res) => {
  const partner = await salesService.createChannelPartner(req.body);
  return ApiResponse.created(res, partner, 'Channel partner created successfully');
});

export const updateChannelPartner = asyncHandler(async (req, res) => {
  const partner = await salesService.updateChannelPartner(req.params.id, req.body);
  return ApiResponse.success(res, partner, 'Channel partner updated successfully');
});

// Retail POS
export const createPosSale = asyncHandler(async (req, res) => {
  const sale = await salesService.createPosSale(req.body, req.user);
  return ApiResponse.created(res, sale, 'POS bill generated successfully');
});

export const getDailyRetailSummary = asyncHandler(async (req, res) => {
  const summary = await salesService.getDailyRetailSummary(req.query.date, req.query.branch_id);
  return ApiResponse.success(res, summary, 'Daily retail summary fetched successfully');
});
