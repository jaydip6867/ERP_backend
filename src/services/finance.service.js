import { Receipt } from '../models/receipt.model.js';
import { Payment } from '../models/payment.model.js';
import { Invoice } from '../models/invoice.model.js';
import { PurchaseInvoice } from '../models/purchaseInvoice.model.js';
import { BankAccount } from '../models/bankAccount.model.js';
import { BankTransaction } from '../models/bankTransaction.model.js';
import { ChartOfAccounts } from '../models/chartOfAccounts.model.js';
import { Customer } from '../models/customer.model.js';
import { DoubleEntryService } from './doubleEntry.service.js';
import { AppError } from '../utils/appError.js';

export class FinanceService {
  /**
   * Record Customer Receipt & settle invoices
   */
  static async createReceipt(data, userId) {
    const { customer_id, bank_account_id, amount, payment_mode, allocations = [], notes, transaction_reference, branch_id } = data;

    const customer = await Customer.findById(customer_id);
    if (!customer) throw AppError.notFound('Customer not found');

    let totalAllocated = 0;
    for (const alloc of allocations) {
      totalAllocated += alloc.allocated_amount || 0;
      const invoice = await Invoice.findById(alloc.invoice_id);
      if (invoice) {
        invoice.balance_amount = Math.max(0, invoice.balance_amount - alloc.allocated_amount);
        if (invoice.balance_amount === 0) {
          invoice.status = 'paid';
        } else {
          invoice.status = 'partially_paid';
        }
        await invoice.save();
      }
    }

    const unallocated = Math.max(0, amount - totalAllocated);

    // Update customer outstanding balance
    customer.outstanding_balance = Math.max(0, (customer.outstanding_balance || 0) - amount);
    await customer.save();

    // Update Bank Account balance if linked
    if (bank_account_id) {
      const bank = await BankAccount.findById(bank_account_id);
      if (bank) {
        bank.current_balance += amount;
        await bank.save();

        await BankTransaction.create({
          bank_account_id,
          transaction_type: 'DEPOSIT',
          amount,
          balance_after: bank.current_balance,
          reference_number: transaction_reference || '',
          description: `Customer Receipt from ${customer.company_name}`,
          is_reconciled: true,
          reconciliation_date: new Date(),
        });
      }
    }

    const receiptCount = await Receipt.countDocuments();
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

    const receipt = await Receipt.create({
      receipt_number: receiptNumber,
      customer_id,
      bank_account_id,
      amount,
      unallocated_amount: unallocated,
      payment_mode: payment_mode || 'BANK_TRANSFER',
      allocations,
      transaction_reference,
      notes,
      branch_id,
      created_by: userId,
    });

    // Auto-create Double Entry: Debit Bank/Cash, Credit Accounts Receivable
    const [bankAcc, arAcc] = await Promise.all([
      ChartOfAccounts.findOne({ sub_type: 'BANK_AND_CASH' }),
      ChartOfAccounts.findOne({ sub_type: 'ACCOUNTS_RECEIVABLE' }),
    ]);

    if (bankAcc && arAcc) {
      await DoubleEntryService.postJournalEntry(
        {
          entry_number: `JV-${receiptNumber}`,
          voucher_type: 'RECEIPT',
          reference_module: 'RECEIPT',
          reference_id: receipt._id,
          narration: `Payment received from customer: ${customer.company_name}`,
          branch_id,
          lines: [
            { account_id: bankAcc._id, debit: amount, credit: 0, narration: `Receipt ${receiptNumber}` },
            { account_id: arAcc._id, debit: 0, credit: amount, narration: `Customer receipt settlement`, party_type: 'Customer', party_id: customer._id },
          ],
        },
        userId
      );
    }

    return receipt;
  }

  /**
   * Record Supplier Payment & settle purchase invoices
   */
  static async createPayment(data, userId) {
    const { supplier_id, bank_account_id, amount, payment_mode, allocations = [], notes, transaction_reference, branch_id } = data;

    let totalAllocated = 0;
    for (const alloc of allocations) {
      totalAllocated += alloc.allocated_amount || 0;
      const bill = await PurchaseInvoice.findById(alloc.purchase_invoice_id);
      if (bill) {
        bill.balance_amount = Math.max(0, (bill.balance_amount || bill.total_amount) - alloc.allocated_amount);
        if (bill.balance_amount === 0) {
          bill.payment_status = 'paid';
        } else {
          bill.payment_status = 'partially_paid';
        }
        await bill.save();
      }
    }

    const unallocated = Math.max(0, amount - totalAllocated);

    if (bank_account_id) {
      const bank = await BankAccount.findById(bank_account_id);
      if (bank) {
        bank.current_balance -= amount;
        await bank.save();

        await BankTransaction.create({
          bank_account_id,
          transaction_type: 'WITHDRAWAL',
          amount,
          balance_after: bank.current_balance,
          reference_number: transaction_reference || '',
          description: `Supplier Payment to Supplier ID ${supplier_id}`,
          is_reconciled: true,
          reconciliation_date: new Date(),
        });
      }
    }

    const payCount = await Payment.countDocuments();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;

    const payment = await Payment.create({
      payment_number: paymentNumber,
      supplier_id,
      bank_account_id,
      amount,
      unallocated_amount: unallocated,
      payment_mode: payment_mode || 'BANK_TRANSFER',
      allocations,
      transaction_reference,
      notes,
      branch_id,
      created_by: userId,
    });

    // Auto-create Double Entry: Debit Accounts Payable, Credit Bank
    const [apAcc, bankAcc] = await Promise.all([
      ChartOfAccounts.findOne({ sub_type: 'ACCOUNTS_PAYABLE' }),
      ChartOfAccounts.findOne({ sub_type: 'BANK_AND_CASH' }),
    ]);

    if (apAcc && bankAcc) {
      await DoubleEntryService.postJournalEntry(
        {
          entry_number: `JV-${paymentNumber}`,
          voucher_type: 'PAYMENT',
          reference_module: 'PAYMENT',
          reference_id: payment._id,
          narration: `Payment made to vendor`,
          branch_id,
          lines: [
            { account_id: apAcc._id, debit: amount, credit: 0, narration: `Supplier settlement`, party_type: 'Supplier', party_id: supplier_id },
            { account_id: bankAcc._id, debit: 0, credit: amount, narration: `Disbursed via ${payment_mode}` },
          ],
        },
        userId
      );
    }

    return payment;
  }

  /**
   * Receivables Aging (0-30, 31-60, 61-90, 90+)
   */
  static async getCustomerReceivables() {
    const invoices = await Invoice.find({
      status: { $in: ['issued', 'partially_paid'] },
      balance_amount: { $gt: 0 },
    }).populate('customer_id', 'company_name customer_code');

    const now = new Date();
    let bucket0_30 = 0;
    let bucket31_60 = 0;
    let bucket61_90 = 0;
    let bucket90Plus = 0;
    let totalReceivable = 0;

    const list = invoices.map((inv) => {
      const days = Math.floor((now - new Date(inv.invoice_date)) / (1000 * 60 * 60 * 24));
      const bal = inv.balance_amount || 0;
      totalReceivable += bal;

      if (days <= 30) bucket0_30 += bal;
      else if (days <= 60) bucket31_60 += bal;
      else if (days <= 90) bucket61_90 += bal;
      else bucket90Plus += bal;

      return {
        invoice_id: inv._id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_id?.company_name || 'N/A',
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        days_overdue: Math.max(0, days),
        total_amount: inv.grand_total,
        balance_amount: bal,
      };
    });

    return {
      total_receivable: Math.round(totalReceivable * 100) / 100,
      aging_buckets: {
        current_0_30: Math.round(bucket0_30 * 100) / 100,
        overdue_31_60: Math.round(bucket31_60 * 100) / 100,
        overdue_61_90: Math.round(bucket61_90 * 100) / 100,
        overdue_90_plus: Math.round(bucket90Plus * 100) / 100,
      },
      invoices: list,
    };
  }

  /**
   * Payables Aging
   */
  static async getSupplierPayables() {
    const bills = await PurchaseInvoice.find({
      payment_status: { $in: ['unpaid', 'partially_paid'] },
    }).populate('supplier_id', 'supplier_name gstin');

    const now = new Date();
    let bucket0_30 = 0;
    let bucket31_60 = 0;
    let bucket61_90 = 0;
    let bucket90Plus = 0;
    let totalPayable = 0;

    const list = bills.map((b) => {
      const days = Math.floor((now - new Date(b.bill_date)) / (1000 * 60 * 60 * 24));
      const bal = b.balance_amount !== undefined ? b.balance_amount : (b.total_amount || 0);
      totalPayable += bal;

      if (days <= 30) bucket0_30 += bal;
      else if (days <= 60) bucket31_60 += bal;
      else if (days <= 90) bucket61_90 += bal;
      else bucket90Plus += bal;

      return {
        bill_id: b._id,
        bill_number: b.vendor_bill_number,
        supplier_name: b.supplier_id?.supplier_name || 'N/A',
        bill_date: b.bill_date,
        due_date: b.payment_due_date,
        days_outstanding: Math.max(0, days),
        total_amount: b.total_amount,
        balance_amount: bal,
      };
    });

    return {
      total_payable: Math.round(totalPayable * 100) / 100,
      aging_buckets: {
        current_0_30: Math.round(bucket0_30 * 100) / 100,
        overdue_31_60: Math.round(bucket31_60 * 100) / 100,
        overdue_61_90: Math.round(bucket61_90 * 100) / 100,
        overdue_90_plus: Math.round(bucket90Plus * 100) / 100,
      },
      bills: list,
    };
  }

  /**
   * Executive Finance Dashboard Overview
   */
  static async getFinanceDashboard() {
    const [pnl, receivables, payables, bankAccounts] = await Promise.all([
      DoubleEntryService.getProfitAndLoss(),
      this.getCustomerReceivables(),
      this.getSupplierPayables(),
      BankAccount.find({ status: 'active' }),
    ]);

    let totalLiquidCash = 0;
    bankAccounts.forEach((b) => (totalLiquidCash += b.current_balance || 0));

    return {
      net_profit: pnl.net_profit,
      margin_percentage: pnl.margin_percentage,
      total_receivable: receivables.total_receivable,
      total_payable: payables.total_payable,
      total_liquid_cash: Math.round(totalLiquidCash * 100) / 100,
      working_capital: Math.round((totalLiquidCash + receivables.total_receivable - payables.total_payable) * 100) / 100,
      aging_receivables: receivables.aging_buckets,
      aging_payables: payables.aging_buckets,
      bank_accounts: bankAccounts,
    };
  }
}

export default FinanceService;
