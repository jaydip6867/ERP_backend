import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

// Expense Category Schema
const expenseCategorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    ledger_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      default: null,
    },
    monthly_budget: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Expense Schema
const expenseSchema = new mongoose.Schema(
  {
    expense_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    expense_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    payment_mode: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'COMPANY_CARD', 'UPI', 'PETTY_CASH'],
      default: 'BANK_TRANSFER',
    },
    bank_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      default: null,
    },
    vendor_name: {
      type: String,
      default: '',
    },
    bill_number: {
      type: String,
      default: '',
    },
    is_recurring: {
      type: Boolean,
      default: false,
    },
    recurring_frequency: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'NONE'],
      default: 'NONE',
    },
    approval_status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

expenseCategorySchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });
expenseSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

export const ExpenseCategory = mongoose.model('ExpenseCategory', expenseCategorySchema);
export const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
