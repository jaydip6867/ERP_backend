import { InvoiceService } from '../services/invoice.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const metrics = await InvoiceService.getDashboardMetrics();
  return ApiResponse.success(res, metrics, 'Invoice dashboard metrics fetched');
});

export const listInvoices = asyncHandler(async (req, res) => {
  const result = await InvoiceService.getInvoices(req.query);
  return ApiResponse.paginated(res, result.invoices, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Invoices fetched successfully');
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.getInvoiceById(req.params.id);
  return ApiResponse.success(res, invoice, 'Invoice fetched successfully');
});

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.createInvoice(req.body, req.user?._id);
  return ApiResponse.created(res, invoice, 'Invoice generated successfully');
});

export const generateEInvoice = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.generateEInvoice(req.params.id);
  return ApiResponse.success(res, invoice, 'E-Invoice IRN and signed QR code generated');
});

export const generateEWayBill = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.generateEWayBill(req.params.id, req.body);
  return ApiResponse.success(res, invoice, 'E-Way Bill generated');
});

export const recordPayment = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.recordPayment(req.params.id, req.body);
  return ApiResponse.success(res, invoice, 'Payment recorded successfully against invoice');
});

export const listCreditDebitNotes = asyncHandler(async (req, res) => {
  const result = await InvoiceService.getCreditDebitNotes(req.query);
  return ApiResponse.paginated(res, result.notes, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Credit/Debit notes fetched successfully');
});

export const createCreditDebitNote = asyncHandler(async (req, res) => {
  const note = await InvoiceService.createCreditDebitNote(req.body, req.user?._id);
  return ApiResponse.created(res, note, 'Credit/Debit note issued successfully');
});

export const getInvoiceAgeing = asyncHandler(async (req, res) => {
  const ageing = await InvoiceService.getInvoiceAgeing();
  return ApiResponse.success(res, ageing, 'Invoice ageing analysis fetched');
});
