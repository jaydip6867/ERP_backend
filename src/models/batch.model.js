import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const batchSchema = new mongoose.Schema(
  {
    batch_number: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
      index: true,
    },
    mfg_date: {
      type: Date,
      default: null,
    },
    expiry_date: {
      type: Date,
      default: null,
      index: true,
    },
    initial_qty: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    current_qty: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reserved_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    cost_rate: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'quarantine', 'expired', 'depleted'],
      default: 'active',
      index: true,
    },
    qc_inspection_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcInspection',
      default: null,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    grn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceiptNote',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.index({ batch_number: 1, product_id: 1, warehouse_id: 1 }, { unique: true });

batchSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
