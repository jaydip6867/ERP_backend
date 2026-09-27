import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const stockReservationSchema = new mongoose.Schema(
  {
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: [true, 'Sales order is required'],
      index: true,
    },
    sales_order_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    reserved_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'released', 'cancelled'],
      default: 'active',
      index: true,
    },
    reserved_at: {
      type: Date,
      default: Date.now,
    },
    released_at: {
      type: Date,
      default: null,
    },
    expiry_date: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

stockReservationSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const StockReservation = mongoose.model('StockReservation', stockReservationSchema);
export default StockReservation;
