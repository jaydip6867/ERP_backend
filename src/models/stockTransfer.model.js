import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const stockTransferItemSchema = new mongoose.Schema(
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
    batch_number: {
      type: String,
      default: null,
    },
    transfer_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
  },
  { _id: true }
);

const stockTransferSchema = new mongoose.Schema(
  {
    transfer_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    transfer_date: {
      type: Date,
      default: Date.now,
    },
    from_warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Source warehouse is required'],
      index: true,
    },
    to_warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Destination warehouse is required'],
      index: true,
    },
    items: [stockTransferItemSchema],
    status: {
      type: String,
      enum: ['draft', 'dispatched', 'in_transit', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    vehicle_no: {
      type: String,
      default: '',
    },
    driver_name: {
      type: String,
      default: '',
    },
    dispatched_at: {
      type: Date,
      default: null,
    },
    received_at: {
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

stockTransferSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
export default StockTransfer;
