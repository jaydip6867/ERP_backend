import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const payrollRecordSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      index: true, // e.g. "2026-09"
    },
    basic_salary: {
      type: Number,
      required: true,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    gross_salary: {
      type: Number,
      required: true,
      default: 0,
    },
    net_salary: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'processed', 'paid', 'hold'],
      default: 'draft',
      index: true,
    },
    payment_date: {
      type: Date,
      default: null,
    },
    payment_mode: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash', 'upi'],
      default: 'bank_transfer',
    },
    transaction_ref: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
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

payrollRecordSchema.index({ employee_id: 1, period: 1 }, { unique: true });

payrollRecordSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PayrollRecord = mongoose.model('PayrollRecord', payrollRecordSchema);
export default PayrollRecord;
