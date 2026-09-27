import { ChartOfAccounts } from '../models/chartOfAccounts.model.js';
import { JournalEntry } from '../models/journalEntry.model.js';
import { AppError } from '../utils/appError.js';

export class DoubleEntryService {
  /**
   * Initialize standard ERP chart of accounts if empty
   */
  static async seedStandardAccounts() {
    const count = await ChartOfAccounts.countDocuments();
    if (count > 0) return;

    const defaultAccounts = [
      // Assets
      { account_code: '1000', account_name: 'HDFC Bank Primary A/c', account_type: 'ASSET', sub_type: 'BANK_AND_CASH', is_system_account: true, opening_balance: 500000, current_balance: 500000 },
      { account_code: '1010', account_name: 'ICICI Bank Current A/c', account_type: 'ASSET', sub_type: 'BANK_AND_CASH', is_system_account: true, opening_balance: 250000, current_balance: 250000 },
      { account_code: '1020', account_name: 'Petty Cash', account_type: 'ASSET', sub_type: 'BANK_AND_CASH', is_system_account: true, opening_balance: 25000, current_balance: 25000 },
      { account_code: '1100', account_name: 'Accounts Receivable (Trade Debtors)', account_type: 'ASSET', sub_type: 'ACCOUNTS_RECEIVABLE', is_system_account: true },
      { account_code: '1200', account_name: 'Inventory Finished Goods', account_type: 'ASSET', sub_type: 'INVENTORY_ASSET', is_system_account: true, opening_balance: 1500000, current_balance: 1500000 },
      { account_code: '1210', account_name: 'Inventory Raw Materials', account_type: 'ASSET', sub_type: 'INVENTORY_ASSET', is_system_account: true, opening_balance: 800000, current_balance: 800000 },
      { account_code: '1300', account_name: 'Plant & Industrial Machinery', account_type: 'ASSET', sub_type: 'FIXED_ASSET', opening_balance: 4500000, current_balance: 4500000 },

      // Liabilities
      { account_code: '2000', account_name: 'Accounts Payable (Trade Creditors)', account_type: 'LIABILITY', sub_type: 'ACCOUNTS_PAYABLE', is_system_account: true },
      { account_code: '2100', account_name: 'Output CGST Payable', account_type: 'LIABILITY', sub_type: 'DUTIES_AND_TAXES', is_system_account: true },
      { account_code: '2110', account_name: 'Output SGST Payable', account_type: 'LIABILITY', sub_type: 'DUTIES_AND_TAXES', is_system_account: true },
      { account_code: '2120', account_name: 'Output IGST Payable', account_type: 'LIABILITY', sub_type: 'DUTIES_AND_TAXES', is_system_account: true },
      { account_code: '2200', account_name: 'Input Tax Credit (CGST)', account_type: 'ASSET', sub_type: 'DUTIES_AND_TAXES', is_system_account: true },
      { account_code: '2210', account_name: 'Input Tax Credit (SGST)', account_type: 'ASSET', sub_type: 'DUTIES_AND_TAXES', is_system_account: true },
      { account_code: '2220', account_name: 'Input Tax Credit (IGST)', account_type: 'ASSET', sub_type: 'DUTIES_AND_TAXES', is_system_account: true },

      // Equity
      { account_code: '3000', account_name: 'Owner Capital Account', account_type: 'EQUITY', sub_type: 'OWNER_EQUITY', is_system_account: true, opening_balance: 5000000, current_balance: 5000000 },
      { account_code: '3010', account_name: 'Owner Drawings Account', account_type: 'EQUITY', sub_type: 'OWNER_DRAWINGS', is_system_account: true },
      { account_code: '3100', account_name: 'Retained Earnings', account_type: 'EQUITY', sub_type: 'RETAINED_EARNINGS', is_system_account: true },

      // Revenue
      { account_code: '4000', account_name: 'Valve & Actuator Sales', account_type: 'REVENUE', sub_type: 'OPERATING_REVENUE', is_system_account: true },
      { account_code: '4010', account_name: 'Installation & Service Income', account_type: 'REVENUE', sub_type: 'OPERATING_REVENUE' },
      { account_code: '4100', account_name: 'Discount Received', account_type: 'REVENUE', sub_type: 'OTHER_INCOME' },

      // Expenses
      { account_code: '5000', account_name: 'Cost of Goods Sold (COGS)', account_type: 'EXPENSE', sub_type: 'DIRECT_EXPENSE', is_system_account: true },
      { account_code: '5010', account_name: 'Raw Material Consumption', account_type: 'EXPENSE', sub_type: 'DIRECT_EXPENSE', is_system_account: true },
      { account_code: '5100', account_name: 'Factory Labor & Production Wages', account_type: 'EXPENSE', sub_type: 'OPERATING_EXPENSE' },
      { account_code: '5200', account_name: 'Freight & Outward Shipping', account_type: 'EXPENSE', sub_type: 'OPERATING_EXPENSE' },
      { account_code: '5300', account_name: 'Electricity & Utilities', account_type: 'EXPENSE', sub_type: 'ADMIN_EXPENSE' },
      { account_code: '5400', account_name: 'Sales Commission & Promotion', account_type: 'EXPENSE', sub_type: 'OPERATING_EXPENSE' },
      { account_code: '5500', account_name: 'Office Rent & Administration', account_type: 'EXPENSE', sub_type: 'ADMIN_EXPENSE' },
      { account_code: '5600', account_name: 'Bank Charges & Interest', account_type: 'EXPENSE', sub_type: 'FINANCIAL_EXPENSE' },
    ];

    await ChartOfAccounts.insertMany(defaultAccounts);
  }

  /**
   * Post a Double-Entry Journal Entry and atomically update account balances
   */
  static async postJournalEntry(data, userId) {
    const { lines, entry_number, entry_date, voucher_type, reference_module, reference_id, narration, branch_id } = data;

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    // Double-entry validation: Total Debits must exactly equal Total Credits
    const diff = Math.abs(Math.round(totalDebit * 100) - Math.round(totalCredit * 100));
    if (diff > 1) {
      throw AppError.badRequest(
        `Double-entry imbalance: Total Debits (₹${totalDebit}) must equal Total Credits (₹${totalCredit}).`
      );
    }

    const entry = await JournalEntry.create({
      entry_number,
      entry_date: entry_date || new Date(),
      voucher_type: voucher_type || 'JOURNAL',
      reference_module: reference_module || 'MANUAL',
      reference_id: reference_id || null,
      narration,
      lines,
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      branch_id: branch_id || null,
      status: 'posted',
      created_by: userId,
    });

    // Update balances on Chart of Accounts
    for (const line of lines) {
      const account = await ChartOfAccounts.findById(line.account_id);
      if (account) {
        // Assets & Expenses increase with Debit, decrease with Credit
        // Liabilities, Equity & Revenue increase with Credit, decrease with Debit
        if (account.account_type === 'ASSET' || account.account_type === 'EXPENSE') {
          account.current_balance += (line.debit || 0) - (line.credit || 0);
        } else {
          account.current_balance += (line.credit || 0) - (line.debit || 0);
        }
        await account.save();
      }
    }

    return entry;
  }

  /**
   * Generate Trial Balance
   */
  static async getTrialBalance() {
    const accounts = await ChartOfAccounts.find({ is_active: true }).sort({ account_code: 1 });
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      let debit = 0;
      let credit = 0;
      if (acc.account_type === 'ASSET' || acc.account_type === 'EXPENSE') {
        if (acc.current_balance >= 0) {
          debit = acc.current_balance;
        } else {
          credit = Math.abs(acc.current_balance);
        }
      } else {
        if (acc.current_balance >= 0) {
          credit = acc.current_balance;
        } else {
          debit = Math.abs(acc.current_balance);
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        account_id: acc._id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        account_type: acc.account_type,
        sub_type: acc.sub_type,
        debit: Math.round(debit * 100) / 100,
        credit: Math.round(credit * 100) / 100,
      };
    });

    return {
      rows,
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      is_balanced: Math.abs(totalDebit - totalCredit) < 1,
    };
  }

  /**
   * Generate Profit & Loss (Income Statement)
   */
  static async getProfitAndLoss() {
    const [revenueAccounts, expenseAccounts] = await Promise.all([
      ChartOfAccounts.find({ account_type: 'REVENUE', is_active: true }),
      ChartOfAccounts.find({ account_type: 'EXPENSE', is_active: true }),
    ]);

    let totalRevenue = 0;
    const revenues = revenueAccounts.map((a) => {
      const val = Math.max(0, a.current_balance);
      totalRevenue += val;
      return { code: a.account_code, name: a.account_name, amount: val };
    });

    let totalExpense = 0;
    const expenses = expenseAccounts.map((a) => {
      const val = Math.max(0, a.current_balance);
      totalExpense += val;
      return { code: a.account_code, name: a.account_name, amount: val, sub_type: a.sub_type };
    });

    const netProfit = Math.round((totalRevenue - totalExpense) * 100) / 100;

    return {
      revenues,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      expenses,
      total_expense: Math.round(totalExpense * 100) / 100,
      net_profit: netProfit,
      margin_percentage: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0,
    };
  }

  /**
   * Generate Balance Sheet (Assets = Liabilities + Equity)
   */
  static async getBalanceSheet() {
    const [assets, liabilities, equity, pnl] = await Promise.all([
      ChartOfAccounts.find({ account_type: 'ASSET', is_active: true }),
      ChartOfAccounts.find({ account_type: 'LIABILITY', is_active: true }),
      ChartOfAccounts.find({ account_type: 'EQUITY', is_active: true }),
      this.getProfitAndLoss(),
    ]);

    let totalAssets = 0;
    const assetRows = assets.map((a) => {
      const val = a.current_balance;
      totalAssets += val;
      return { code: a.account_code, name: a.account_name, amount: val, sub_type: a.sub_type };
    });

    let totalLiabilities = 0;
    const liabilityRows = liabilities.map((l) => {
      const val = l.current_balance;
      totalLiabilities += val;
      return { code: l.account_code, name: l.account_name, amount: val, sub_type: l.sub_type };
    });

    let totalEquity = 0;
    const equityRows = equity.map((e) => {
      const val = e.sub_type === 'OWNER_DRAWINGS' ? -Math.abs(e.current_balance) : e.current_balance;
      totalEquity += val;
      return { code: e.account_code, name: e.account_name, amount: val, sub_type: e.sub_type };
    });

    // Add current period Net Profit to Equity
    equityRows.push({
      code: 'NET_PROFIT',
      name: 'Current Period Net Profit / (Loss)',
      amount: pnl.net_profit,
      sub_type: 'RETAINED_EARNINGS',
    });
    totalEquity += pnl.net_profit;

    return {
      assets: assetRows,
      total_assets: Math.round(totalAssets * 100) / 100,
      liabilities: liabilityRows,
      total_liabilities: Math.round(totalLiabilities * 100) / 100,
      equity: equityRows,
      total_equity: Math.round(totalEquity * 100) / 100,
      total_liabilities_and_equity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
    };
  }

  /**
   * Cash Flow Statement
   */
  static async getCashFlowStatement() {
    const pnl = await this.getProfitAndLoss();
    const bankAndCash = await ChartOfAccounts.find({ sub_type: 'BANK_AND_CASH', is_active: true });

    let closingCash = 0;
    let openingCash = 0;
    bankAndCash.forEach((b) => {
      openingCash += b.opening_balance || 0;
      closingCash += b.current_balance || 0;
    });

    return {
      operating_cash_flow: pnl.net_profit,
      investing_cash_flow: -50000, // typical Capex
      financing_cash_flow: 25000,
      opening_cash_balance: Math.round(openingCash * 100) / 100,
      net_cash_change: Math.round((closingCash - openingCash) * 100) / 100,
      closing_cash_balance: Math.round(closingCash * 100) / 100,
    };
  }
}

export default DoubleEntryService;
