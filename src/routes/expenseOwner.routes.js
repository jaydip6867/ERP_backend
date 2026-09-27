import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import {
  getExpenses,
  createExpense,
  getExpenseCategories,
  createExpenseCategory,
  getExpenseBudgetReport,
  getOwnerTransactions,
  createOwnerTransaction,
  getSafeToWithdraw,
} from '../controllers/expenseOwner.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/expenses', requirePermission('finance', 'can_view'), getExpenses);
router.post('/expenses', requirePermission('finance', 'can_create'), createExpense);
router.get('/categories', requirePermission('finance', 'can_view'), getExpenseCategories);
router.post('/categories', requirePermission('finance', 'can_create'), createExpenseCategory);
router.get('/budgets', requirePermission('finance', 'can_view'), getExpenseBudgetReport);

// Owner Capital / Drawings / Safe-to-Withdraw
router.get('/owner-ledger', requirePermission('finance', 'can_view'), getOwnerTransactions);
router.post('/owner-ledger', requirePermission('finance', 'can_create'), createOwnerTransaction);
router.get('/safe-to-withdraw', requirePermission('finance', 'can_view'), getSafeToWithdraw);

export default router;
