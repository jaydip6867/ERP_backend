import { ExpenseOwnerService } from '../services/expenseOwner.service.js';
import { Expense, ExpenseCategory } from '../models/expense.model.js';
import { OwnerFinance } from '../models/ownerFinance.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find().populate('category_id bank_account_id').sort({ expense_date: -1 });
  return ApiResponse.success(res, expenses, 'Expenses fetched');
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await ExpenseOwnerService.createExpense(req.body, req.user?._id);
  return ApiResponse.created(res, expense, 'Operating expense recorded and posted');
});

export const getExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await ExpenseCategory.find({ status: 'active' });
  return ApiResponse.success(res, categories, 'Categories fetched');
});

export const createExpenseCategory = asyncHandler(async (req, res) => {
  const cat = await ExpenseCategory.create({ ...req.body, created_by: req.user?._id });
  return ApiResponse.created(res, cat, 'Expense category created');
});

export const getExpenseBudgetReport = asyncHandler(async (req, res) => {
  const report = await ExpenseOwnerService.getExpenseBudgetSummary();
  return ApiResponse.success(res, report, 'Budget variance report fetched');
});

// Owner Capital & Drawings
export const getOwnerTransactions = asyncHandler(async (req, res) => {
  const ledger = await ExpenseOwnerService.getOwnerLedger();
  return ApiResponse.success(res, ledger, 'Owner capital & drawings ledger fetched');
});

export const createOwnerTransaction = asyncHandler(async (req, res) => {
  const tx = await ExpenseOwnerService.recordOwnerTransaction(req.body, req.user?._id);
  return ApiResponse.created(res, tx, 'Owner transaction recorded and equity ledger posted');
});

export const getSafeToWithdraw = asyncHandler(async (req, res) => {
  const analysis = await ExpenseOwnerService.getSafeToWithdrawAnalysis();
  return ApiResponse.success(res, analysis, 'Safe-to-withdraw surplus analysis fetched');
});
