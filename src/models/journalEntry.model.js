import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const journalLineSchema = new mongoose.Schema(
  {
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChartOfAccounts',
      required: true,
      index: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    narration: {
      type: String,
      default: '',
    },
    party_type: {
      type: String,
      enum: ['Customer', 'Supplier', 'User', 'None'],
      default: 'None',
    },
    party_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      refPath: 'lines.party_type',
    },
  },
  { _id: true }
);

const journalEntrySchema = new mongoose.Schema(
  {
    entry_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    entry_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    voucher_type: {
      type: String,
      enum: ['JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA', 'SALES', 'PURCHASE', 'EXPENSE', 'DRAWING'],
      default: 'JOURNAL',
      index: true,
    },
    reference_module: {
      type: String,
      enum: ['MANUAL', 'INVOICE', 'PURCHASE_INVOICE', 'RECEIPT', 'PAYMENT', 'EXPENSE', 'OWNER_DRAWING', 'SALES_RETURN'],
      default: 'MANUAL',
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    narration: {
      type: String,
      required: true,
    },
    lines: {
      type: [journalLineSchema],
      validate: [
        (val) => val && val.length >= 2,
        'A journal entry must contain at least 2 lines (debit and credit).',
      ],
    },
    total_debit: {
      type: Number,
      required: true,
      min: 0,
    },
    total_credit: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'posted', 'reversed'],
      default: 'posted',
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

journalEntrySchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
