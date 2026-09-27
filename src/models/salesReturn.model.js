import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const salesReturnItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    batch_number: String,
    return_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    accepted_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    scrapped_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    rate: {
      type: Number,
      default: 0,
    },
    condition: {
      type: String,
      enum: ['sealed', 'opened_intact', 'damaged_transit', 'manufacturing_defect'],
      default: 'sealed',
    },
    disposition: {
      type: String,
      enum: ['restock', 'rework', 'scrap', 'under_inspection'],
      default: 'under_inspection',
    },
    reason: String,
  },
  { _id: true }
);

const salesReturnSchema = new mongoose.Schema(
  {
    return_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    return_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dispatch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispatch',
      default: null,
      index: true,
    },
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    return_type: {
      type: String,
      enum: ['customer_return', 'rto', 'wrong_shipment', 'rejection_at_delivery'],
      default: 'customer_return',
    },
    items: [salesReturnItemSchema],
    qc_inspection_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcInspection',
      default: null,
    },
    credit_note_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreditDebitNote',
      default: null,
    },
    status: {
      type: String,
      enum: ['received', 'qc_pending', 'qc_passed', 'restocked', 'rejected'],
      default: 'received',
      index: true,
    },
    stock_restocked: {
      type: Boolean,
      default: false,
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

salesReturnSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const SalesReturn = mongoose.model('SalesReturn', salesReturnSchema);
export default SalesReturn;
