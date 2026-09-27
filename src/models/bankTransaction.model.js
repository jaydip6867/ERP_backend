import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const bankTransactionSchema = new mongoose.Schema(
  {
    bank_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
      index: true,
    },
    transaction_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    value_date: {
      type: Date,
      default: Date.now,
    },
    transaction_type: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAWAL'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    balance_after: {
      type: Number,
      required: true,
    },
    reference_number: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    is_reconciled: {
      type: Boolean,
      default: false,
      index: true,
    },
    reconciliation_date: {
      type: Date,
      default: null,
    },
    matched_voucher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bankTransactionSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);
export default BankTransaction;
