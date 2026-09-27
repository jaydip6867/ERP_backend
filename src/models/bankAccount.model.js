import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const bankAccountSchema = new mongoose.Schema(
  {
    account_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bank_name: {
      type: String,
      required: true,
      trim: true,
    },
    account_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ifsc_code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    branch_name: {
      type: String,
      default: '',
    },
    account_type: {
      type: String,
      enum: ['CURRENT', 'SAVINGS', 'OVERDRAFT', 'CASH_CREDIT'],
      default: 'CURRENT',
    },
    ledger_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      default: null,
    },
    opening_balance: {
      type: Number,
      default: 0,
    },
    current_balance: {
      type: Number,
      default: 0,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'closed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bankAccountSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;
