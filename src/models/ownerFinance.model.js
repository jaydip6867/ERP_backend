import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const ownerFinanceSchema = new mongoose.Schema(
  {
    transaction_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    transaction_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    owner_name: {
      type: String,
      required: true,
      trim: true,
    },
    transaction_type: {
      type: String,
      enum: ['CAPITAL_INFUSION', 'DRAWINGS', 'OWNER_LOAN_GIVEN', 'OWNER_LOAN_REPAID', 'PROFIT_DISTRIBUTION'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    equity_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      default: null,
    },
    bank_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
    },
    payment_mode: {
      type: String,
      enum: ['BANK_TRANSFER', 'CHEQUE', 'NEFT', 'RTGS', 'UPI'],
      default: 'BANK_TRANSFER',
    },
    reference_number: {
      type: String,
      default: '',
    },
    interest_rate: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    approval_status: {
      type: String,
      enum: ['approved', 'pending', 'cancelled'],
      default: 'approved',
    },
  },
  {
    timestamps: true,
  }
);

ownerFinanceSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const OwnerFinance = mongoose.model('OwnerFinance', ownerFinanceSchema);
export default OwnerFinance;
