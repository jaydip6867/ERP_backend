import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const posItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    sku: String,
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    gst_rate: {
      type: Number,
      default: 18,
    },
    tax_amount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const retailPosSchema = new mongoose.Schema(
  {
    bill_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    bill_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    cashier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer_name: {
      type: String,
      default: 'Walk-in Customer',
    },
    customer_phone: {
      type: String,
      default: '',
    },
    items: [posItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    discount_total: {
      type: Number,
      default: 0,
    },
    tax_total: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      default: 0,
    },
    payment_mode: {
      type: String,
      enum: ['cash', 'card', 'upi', 'credit', 'split'],
      default: 'cash',
    },
    amount_paid: {
      type: Number,
      default: 0,
    },
    change_returned: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'refunded'],
      default: 'completed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

retailPosSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const RetailPos = mongoose.model('RetailPos', retailPosSchema);
export default RetailPos;
