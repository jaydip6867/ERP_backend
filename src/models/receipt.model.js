import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const receiptAllocationSchema = new mongoose.Schema(
  {
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    allocated_amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const receiptSchema = new mongoose.Schema(
  {
    receipt_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    receipt_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    payment_mode: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'UPI', 'CREDIT_CARD'],
      required: true,
      default: 'BANK_TRANSFER',
    },
    bank_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unallocated_amount: {
      type: Number,
      default: 0,
    },
    allocations: [receiptAllocationSchema],
    transaction_reference: {
      type: String,
      default: '',
    },
    cheque_number: {
      type: String,
      default: '',
    },
    cheque_date: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'cleared', 'bounced', 'cancelled'],
      default: 'cleared',
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

receiptSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Receipt = mongoose.model('Receipt', receiptSchema);
export default Receipt;
