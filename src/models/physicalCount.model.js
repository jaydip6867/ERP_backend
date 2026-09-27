import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const physicalCountItemSchema = new mongoose.Schema(
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
    counted_qty: {
      type: Number,
      required: true,
      default: 0,
    },
    variance_qty: {
      type: Number,
      default: 0, // counted - system
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const physicalCountSchema = new mongoose.Schema(
  {
    count_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    count_date: {
      type: Date,
      default: Date.now,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
      index: true,
    },
    items: [physicalCountItemSchema],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'reconciled', 'cancelled'],
      default: 'in_progress',
      index: true,
    },
    reconciled_at: {
      type: Date,
      default: null,
    },
    reconciled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    stock_adjustment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockAdjustment',
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

physicalCountSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PhysicalCount = mongoose.model('PhysicalCount', physicalCountSchema);
export default PhysicalCount;
