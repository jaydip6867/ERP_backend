import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import * as extController from '../controllers/extensions.controller.js';
import {
  getChartOfAccounts,
  createChartAccount,
  getJournalEntries,
  createJournalEntry,
  getReceipts,
  createReceipt,
  getPayments,
  createPayment,
  getCustomerReceivables,
  getSupplierPayables,
  getBankAccounts,
  createBankAccount,
  getBankTransactions,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getCashFlowStatement,
  getFinanceDashboard,
} from '../controllers/finance.controller.js';

const router = Router();
router.use(authenticateUser);

router.get('/dashboard', requirePermission('finance', 'can_view'), getFinanceDashboard);
router.get('/chart-of-accounts', requirePermission('finance', 'can_view'), getChartOfAccounts);
router.post('/chart-of-accounts', requirePermission('finance', 'can_create'), createChartAccount);

router.get('/journals', requirePermission('finance', 'can_view'), getJournalEntries);
router.post('/journals', requirePermission('finance', 'can_create'), createJournalEntry);

router.get('/receipts', requirePermission('finance', 'can_view'), getReceipts);
router.post('/receipts', requirePermission('finance', 'can_create'), createReceipt);

router.get('/payments', requirePermission('finance', 'can_view'), getPayments);
router.post('/payments', requirePermission('finance', 'can_create'), createPayment);

router.get('/receivables', requirePermission('finance', 'can_view'), getCustomerReceivables);
router.get('/payables', requirePermission('finance', 'can_view'), getSupplierPayables);

router.get('/banks', requirePermission('finance', 'can_view'), getBankAccounts);
router.post('/banks', requirePermission('finance', 'can_create'), createBankAccount);
router.get('/banks/transactions', requirePermission('finance', 'can_view'), getBankTransactions);

router.get('/reports/trial-balance', requirePermission('finance', 'can_view'), getTrialBalance);
router.get('/reports/pnl', requirePermission('finance', 'can_view'), getProfitAndLoss);
router.get('/reports/balance-sheet', requirePermission('finance', 'can_view'), getBalanceSheet);
router.get('/reports/cash-flow', requirePermission('finance', 'can_view'), getCashFlowStatement);

// Finance Extensions (Costing, Budgeting, MIS)
router.get('/cost-centers', requirePermission('finance', 'can_view'), extController.getCostCenters);
router.post('/cost-centers', requirePermission('finance', 'can_create'), extController.createCostCenter);
router.get('/management-reports', requirePermission('finance', 'can_view'), extController.getManagementReports);
router.post('/management-reports', requirePermission('finance', 'can_create'), extController.createManagementReport);

export default router;
