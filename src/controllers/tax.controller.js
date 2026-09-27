import { TaxService } from '../services/tax.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTaxRates = asyncHandler(async (req, res) => {
  const rates = await TaxService.getTaxRates();
  return ApiResponse.success(res, rates, 'Tax rates fetched successfully');
});

export const createTaxRate = asyncHandler(async (req, res) => {
  const rate = await TaxService.createTaxRate(req.body, req.user?._id);
  return ApiResponse.created(res, rate, 'Tax rate created successfully');
});

export const updateTaxRate = asyncHandler(async (req, res) => {
  const rate = await TaxService.updateTaxRate(req.params.id, req.body, req.user?._id);
  return ApiResponse.success(res, rate, 'Tax rate updated successfully');
});

export const getGstr1 = asyncHandler(async (req, res) => {
  const gstr1 = await TaxService.getGstr1(req.query);
  return ApiResponse.success(res, gstr1, 'GSTR-1 report generated successfully');
});

export const getGstr3b = asyncHandler(async (req, res) => {
  const gstr3b = await TaxService.getGstr3b(req.query);
  return ApiResponse.success(res, gstr3b, 'GSTR-3B summary generated successfully');
});

export const getItcRegister = asyncHandler(async (req, res) => {
  const itc = await TaxService.getItcRegister(req.query);
  return ApiResponse.success(res, itc, 'Input Tax Credit (ITC) register fetched');
});

export const getTaxLedgerSummary = asyncHandler(async (req, res) => {
  const ledger = await TaxService.getTaxLedgerSummary();
  return ApiResponse.success(res, ledger, 'Tax ledger summary fetched');
});
