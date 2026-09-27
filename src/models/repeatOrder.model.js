import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const repeatOrderSchema = new mongoose.Schema(
  {
    schedule_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    previous_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    estimated_quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    average_consumption_days: {
      type: Number,
      required: true,
      default: 30,
    },
    expected_reorder_date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'due', 'contacted', 'ordered', 'deferred', 'lost'],
      default: 'upcoming',
      index: true,
    },
    assigned_salesperson_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    contact_notes: {
      type: String,
      default: '',
    },
    new_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

repeatOrderSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const RepeatOrder = mongoose.model('RepeatOrder', repeatOrderSchema);
export default RepeatOrder;
