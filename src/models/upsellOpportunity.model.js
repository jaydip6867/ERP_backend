import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const upsellOpportunitySchema = new mongoose.Schema(
  {
    opportunity_number: {
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
    opportunity_type: {
      type: String,
      enum: ['UPSELL', 'CROSS_SELL', 'ACCESSORY', 'UPGRADE'],
      default: 'CROSS_SELL',
    },
    trigger_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    suggested_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    estimated_revenue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['suggested', 'contacted', 'accepted', 'converted_to_order', 'rejected'],
      default: 'suggested',
      index: true,
    },
    assigned_salesperson_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    followup_notes: {
      type: String,
      default: '',
    },
    converted_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

upsellOpportunitySchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const UpsellOpportunity = mongoose.model('UpsellOpportunity', upsellOpportunitySchema);
export default UpsellOpportunity;
