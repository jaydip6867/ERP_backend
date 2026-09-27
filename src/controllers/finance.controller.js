import { FinanceService } from '../services/finance.service.js';
import { DoubleEntryService } from '../services/doubleEntry.service.js';
import { ChartOfAccounts } from '../models/chartOfAccounts.model.js';
import { JournalEntry } from '../models/journalEntry.model.js';
import { Receipt } from '../models/receipt.model.js';
import { Payment } from '../models/payment.model.js';
import { BankAccount } from '../models/bankAccount.model.js';
import { BankTransaction } from '../models/bankTransaction.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getChartOfAccounts = asyncHandler(async (req, res) => {
  await DoubleEntryService.seedStandardAccounts();
  const accounts = await ChartOfAccounts.find({ is_active: true }).sort({ account_code: 1 });
  return ApiResponse.success(res, accounts, 'Chart of Accounts fetched successfully');
});

export const createChartAccount = asyncHandler(async (req, res) => {
  const account = await ChartOfAccounts.create({ ...req.body, created_by: req.user?._id });
  return ApiResponse.created(res, account, 'Account created successfully');
});

export const getJournalEntries = asyncHandler(async (req, res) => {
  const entries = await JournalEntry.find().populate('lines.account_id').sort({ entry_date: -1 }).limit(100);
  return ApiResponse.success(res, entries, 'Journal entries fetched');
});

export const createJournalEntry = asyncHandler(async (req, res) => {
  const entry = await DoubleEntryService.postJournalEntry(req.body, req.user?._id);
  return ApiResponse.created(res, entry, 'Double-entry journal posted successfully');
});

export const getReceipts = asyncHandler(async (req, res) => {
  const receipts = await Receipt.find().populate('customer_id bank_account_id').sort({ receipt_date: -1 });
  return ApiResponse.success(res, receipts, 'Customer receipts fetched');
});

export const createReceipt = asyncHandler(async (req, res) => {
  const receipt = await FinanceService.createReceipt(req.body, req.user?._id);
  return ApiResponse.created(res, receipt, 'Receipt recorded and invoices settled');
});

export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate('supplier_id bank_account_id').sort({ payment_date: -1 });
  return ApiResponse.success(res, payments, 'Supplier payments fetched');
});

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await FinanceService.createPayment(req.body, req.user?._id);
  return ApiResponse.created(res, payment, 'Payment recorded and supplier bills settled');
});

export const getCustomerReceivables = asyncHandler(async (req, res) => {
  const data = await FinanceService.getCustomerReceivables();
  return ApiResponse.success(res, data, 'Receivables aging fetched');
});

export const getSupplierPayables = asyncHandler(async (req, res) => {
  const data = await FinanceService.getSupplierPayables();
  return ApiResponse.success(res, data, 'Payables aging fetched');
});

export const getBankAccounts = asyncHandler(async (req, res) => {
  const banks = await BankAccount.find();
  return ApiResponse.success(res, banks, 'Bank accounts fetched');
});

export const createBankAccount = asyncHandler(async (req, res) => {
  const bank = await BankAccount.create({ ...req.body, created_by: req.user?._id });
  return ApiResponse.created(res, bank, 'Bank account created');
});

export const getBankTransactions = asyncHandler(async (req, res) => {
  const { accountId } = req.query;
  const filter = accountId ? { bank_account_id: accountId } : {};
  const txs = await BankTransaction.find(filter).sort({ transaction_date: -1 }).limit(100);
  return ApiResponse.success(res, txs, 'Bank statement transactions fetched');
});

export const getTrialBalance = asyncHandler(async (req, res) => {
  const tb = await DoubleEntryService.getTrialBalance();
  return ApiResponse.success(res, tb, 'Trial Balance generated');
});

export const getProfitAndLoss = asyncHandler(async (req, res) => {
  const pnl = await DoubleEntryService.getProfitAndLoss();
  return ApiResponse.success(res, pnl, 'Profit & Loss Statement generated');
});

export const getBalanceSheet = asyncHandler(async (req, res) => {
  const bs = await DoubleEntryService.getBalanceSheet();
  return ApiResponse.success(res, bs, 'Balance Sheet generated');
});

export const getCashFlowStatement = asyncHandler(async (req, res) => {
  const cf = await DoubleEntryService.getCashFlowStatement();
  return ApiResponse.success(res, cf, 'Cash Flow Statement generated');
});

export const getFinanceDashboard = asyncHandler(async (req, res) => {
  const dash = await FinanceService.getFinanceDashboard();
  return ApiResponse.success(res, dash, 'Finance dashboard metrics fetched');
});
