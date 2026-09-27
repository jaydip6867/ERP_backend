import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const chartOfAccountsSchema = new mongoose.Schema(
  {
    account_code: {
      type: String,
      required: [true, 'Account code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    account_name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      index: true,
    },
    account_type: {
      type: String,
      enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
      required: true,
      index: true,
    },
    sub_type: {
      type: String,
      enum: [
        'CURRENT_ASSET',
        'FIXED_ASSET',
        'BANK_AND_CASH',
        'ACCOUNTS_RECEIVABLE',
        'INVENTORY_ASSET',
        'CURRENT_LIABILITY',
        'ACCOUNTS_PAYABLE',
        'DUTIES_AND_TAXES',
        'LONG_TERM_LIABILITY',
        'OWNER_EQUITY',
        'OWNER_DRAWINGS',
        'RETAINED_EARNINGS',
        'OPERATING_REVENUE',
        'OTHER_INCOME',
        'DIRECT_EXPENSE',
        'OPERATING_EXPENSE',
        'ADMIN_EXPENSE',
        'FINANCIAL_EXPENSE',
      ],
      required: true,
    },
    parent_id: {
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
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    is_system_account: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

chartOfAccountsSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const ChartOfAccounts = mongoose.model('ChartOfAccounts', chartOfAccountsSchema);
export default ChartOfAccounts;
