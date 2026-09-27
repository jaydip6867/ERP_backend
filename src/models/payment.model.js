import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const paymentAllocationSchema = new mongoose.Schema(
  {
    purchase_invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseInvoice',
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

const paymentSchema = new mongoose.Schema(
  {
    payment_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    payment_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    payment_mode: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'UPI'],
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
    allocations: [paymentAllocationSchema],
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
      enum: ['draft', 'processed', 'cleared', 'cancelled'],
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

paymentSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
