import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const stockAdjustmentItemSchema = new mongoose.Schema(
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
    system_qty: {
      type: Number,
      required: true,
      default: 0,
    },
    physical_qty: {
      type: Number,
      required: true,
      default: 0,
    },
    adjusted_qty: {
      type: Number,
      required: true, // positive for addition, negative for deduction
    },
    cost_rate: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const stockAdjustmentSchema = new mongoose.Schema(
  {
    adjustment_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    adjustment_date: {
      type: Date,
      default: Date.now,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
      index: true,
    },
    reason_code: {
      type: String,
      enum: ['PHYSICAL_COUNT', 'DAMAGE', 'EXPIRY', 'SCRAP', 'FOUND_STOCK', 'THEFT', 'OTHER'],
      default: 'PHYSICAL_COUNT',
    },
    items: [stockAdjustmentItemSchema],
    status: {
      type: String,
      enum: ['draft', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approved_at: {
      type: Date,
      default: null,
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

stockAdjustmentSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);
export default StockAdjustment;
