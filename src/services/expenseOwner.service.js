import { Expense, ExpenseCategory } from '../models/expense.model.js';
import { OwnerFinance } from '../models/ownerFinance.model.js';
import { BankAccount } from '../models/bankAccount.model.js';
import { PurchaseInvoice } from '../models/purchaseInvoice.model.js';
import { Invoice } from '../models/invoice.model.js';
import { DoubleEntryService } from './doubleEntry.service.js';
import { ChartOfAccounts } from '../models/chartOfAccounts.model.js';
import { AppError } from '../utils/appError.js';

export class ExpenseOwnerService {
  /**
   * Record Operating Expense
   */
  static async createExpense(data, userId) {
    const { category_id, title, amount, payment_mode, bank_account_id, vendor_name, bill_number, is_recurring, recurring_frequency, branch_id, remarks } = data;

    const category = await ExpenseCategory.findById(category_id);
    if (!category) throw AppError.notFound('Expense category not found');

    const expCount = await Expense.countDocuments();
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(expCount + 1).padStart(4, '0')}`;

    if (bank_account_id) {
      const bank = await BankAccount.findById(bank_account_id);
      if (bank) {
        bank.current_balance -= amount;
        await bank.save();
      }
    }

    const expense = await Expense.create({
      expense_number: expenseNumber,
      category_id,
      title,
      amount,
      payment_mode,
      bank_account_id,
      vendor_name,
      bill_number,
      is_recurring,
      recurring_frequency,
      branch_id,
      remarks,
      created_by: userId,
    });

    // Double Entry for Operating Expense: Debit Expense Account, Credit Bank
    const [expAcc, bankAcc] = await Promise.all([
      category.ledger_account_id ? ChartOfAccounts.findById(category.ledger_account_id) : ChartOfAccounts.findOne({ sub_type: 'OPERATING_EXPENSE' }),
      ChartOfAccounts.findOne({ sub_type: 'BANK_AND_CASH' }),
    ]);

    if (expAcc && bankAcc) {
      await DoubleEntryService.postJournalEntry(
        {
          entry_number: `JV-${expenseNumber}`,
          voucher_type: 'EXPENSE',
          reference_module: 'EXPENSE',
          reference_id: expense._id,
          narration: `Operating Expense: ${title} (${category.category_name})`,
          branch_id,
          lines: [
            { account_id: expAcc._id, debit: amount, credit: 0, narration: title },
            { account_id: bankAcc._id, debit: 0, credit: amount, narration: `Paid via ${payment_mode}` },
          ],
        },
        userId
      );
    }

    return expense;
  }

  /**
   * Expense vs Budget Performance Analysis
   */
  static async getExpenseBudgetSummary() {
    const categories = await ExpenseCategory.find({ status: 'active' });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const expensesThisMonth = await Expense.aggregate([
      { $match: { expense_date: { $gte: startOfMonth }, approval_status: { $ne: 'rejected' } } },
      { $group: { _id: '$category_id', totalSpent: { $sum: '$amount' } } },
    ]);

    const spentMap = {};
    expensesThisMonth.forEach((e) => {
      spentMap[e._id.toString()] = e.totalSpent;
    });

    let totalBudget = 0;
    let totalActual = 0;

    const list = categories.map((cat) => {
      const budget = cat.monthly_budget || 0;
      const spent = spentMap[cat._id.toString()] || 0;
      totalBudget += budget;
      totalActual += spent;

      return {
        category_id: cat._id,
        category_name: cat.category_name,
        code: cat.code,
        monthly_budget: budget,
        spent_this_month: spent,
        variance: budget - spent,
        utilization_percentage: budget > 0 ? Math.round((spent / budget) * 10000) / 100 : 0,
      };
    });

    return {
      total_monthly_budget: totalBudget,
      total_actual_spent: totalActual,
      variance: totalBudget - totalActual,
      categories: list,
    };
  }

  /**
   * Record Owner Capital / Drawings / Loan
   * Crucial rule: Drawings are equity reductions, NOT operating expenses!
   */
  static async recordOwnerTransaction(data, userId) {
    const { owner_name, transaction_type, amount, bank_account_id, payment_mode, reference_number, interest_rate, notes } = data;

    const bank = await BankAccount.findById(bank_account_id);
    if (!bank) throw AppError.notFound('Bank account not found');

    if (transaction_type === 'DRAWINGS') {
      if (bank.current_balance < amount) {
        throw AppError.badRequest(`Insufficient liquid bank balance for drawings. Current: ₹${bank.current_balance}`);
      }
      bank.current_balance -= amount;
    } else if (transaction_type === 'CAPITAL_INFUSION' || transaction_type === 'OWNER_LOAN_GIVEN') {
      bank.current_balance += amount;
    }
    await bank.save();

    const count = await OwnerFinance.countDocuments();
    const txNumber = `OWN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const tx = await OwnerFinance.create({
      transaction_number: txNumber,
      owner_name,
      transaction_type,
      amount,
      bank_account_id,
      payment_mode: payment_mode || 'BANK_TRANSFER',
      reference_number,
      interest_rate: interest_rate || 0,
      notes,
      created_by: userId,
    });

    // Double Entry:
    // If CAPITAL_INFUSION: Debit Bank, Credit Owner Capital (Equity)
    // If DRAWINGS: Debit Owner Drawings (Equity Reduction), Credit Bank
    const [bankAcc, equityCapitalAcc, equityDrawingsAcc] = await Promise.all([
      ChartOfAccounts.findOne({ sub_type: 'BANK_AND_CASH' }),
      ChartOfAccounts.findOne({ sub_type: 'OWNER_EQUITY' }),
      ChartOfAccounts.findOne({ sub_type: 'OWNER_DRAWINGS' }),
    ]);

    if (bankAcc && equityCapitalAcc && equityDrawingsAcc) {
      if (transaction_type === 'CAPITAL_INFUSION') {
        await DoubleEntryService.postJournalEntry(
          {
            entry_number: `JV-${txNumber}`,
            voucher_type: 'JOURNAL',
            reference_module: 'MANUAL',
            reference_id: tx._id,
            narration: `Owner Capital Infusion by ${owner_name}`,
            lines: [
              { account_id: bankAcc._id, debit: amount, credit: 0, narration: `Capital infused in bank` },
              { account_id: equityCapitalAcc._id, debit: 0, credit: amount, narration: `Owner capital credited` },
            ],
          },
          userId
        );
      } else if (transaction_type === 'DRAWINGS') {
        await DoubleEntryService.postJournalEntry(
          {
            entry_number: `JV-${txNumber}`,
            voucher_type: 'DRAWING',
            reference_module: 'OWNER_DRAWING',
            reference_id: tx._id,
            narration: `Owner Drawings / Withdrawal by ${owner_name}`,
            lines: [
              { account_id: equityDrawingsAcc._id, debit: amount, credit: 0, narration: `Owner drawings debited (equity reduction)` },
              { account_id: bankAcc._id, debit: 0, credit: amount, narration: `Disbursed from bank` },
            ],
          },
          userId
        );
      }
    }

    return tx;
  }

  /**
   * Safe-to-Withdraw Calculator
   * Assesses free cash surplus after accounting for immediate liabilities
   */
  static async getSafeToWithdrawAnalysis() {
    const [bankAccounts, unpaidBills, monthlyExpenses] = await Promise.all([
      BankAccount.find({ status: 'active' }),
      PurchaseInvoice.aggregate([
        { $match: { payment_status: { $in: ['unpaid', 'partially_paid'] } } },
        { $group: { _id: null, totalPayable: { $sum: '$balance_amount' } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            expense_date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            approval_status: { $ne: 'rejected' },
          },
        },
        { $group: { _id: null, avg30Days: { $sum: '$amount' } } },
      ]),
    ]);

    let totalCash = 0;
    bankAccounts.forEach((b) => (totalCash += b.current_balance || 0));

    const pendingPayables = unpaidBills[0]?.totalPayable || 0;
    const monthlyRunRate = monthlyExpenses[0]?.avg30Days || 150000;
    const estimatedTaxLiability = 45000; // statutory buffer

    const safeToWithdraw = Math.max(0, totalCash - pendingPayables - estimatedTaxLiability - monthlyRunRate);

    return {
      current_liquid_cash: Math.round(totalCash * 100) / 100,
      deductions: {
        pending_supplier_payables: Math.round(pendingPayables * 100) / 100,
        estimated_statutory_taxes: estimatedTaxLiability,
        monthly_operating_buffer: Math.round(monthlyRunRate * 100) / 100,
      },
      safe_to_withdraw_amount: Math.round(safeToWithdraw * 100) / 100,
      is_healthy: safeToWithdraw > 0,
      recommendation:
        safeToWithdraw > 100000
          ? 'Healthy free cash flow. Safe to execute dividend/drawings withdrawal.'
          : 'Caution: Free cash surplus is tight relative to upcoming payables and operational expenses.',
    };
  }

  /**
   * Owner Ledger
   */
  static async getOwnerLedger() {
    const transactions = await OwnerFinance.find().sort({ transaction_date: -1 });

    let netEquity = 0;
    let totalDrawings = 0;
    let totalInfused = 0;

    transactions.forEach((t) => {
      if (t.transaction_type === 'CAPITAL_INFUSION') {
        netEquity += t.amount;
        totalInfused += t.amount;
      } else if (t.transaction_type === 'DRAWINGS') {
        netEquity -= t.amount;
        totalDrawings += t.amount;
      }
    });

    return {
      net_equity: Math.round(netEquity * 100) / 100,
      total_capital_infused: Math.round(totalInfused * 100) / 100,
      total_drawings: Math.round(totalDrawings * 100) / 100,
      transactions,
    };
  }
}

export default ExpenseOwnerService;
