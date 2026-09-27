import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const targetGoalSchema = new mongoose.Schema(
  {
    target_name: {
      type: String,
      required: true,
      trim: true,
    },
    target_type: {
      type: String,
      enum: ['COMPANY', 'BRANCH', 'TEAM', 'USER', 'PRODUCT'],
      required: true,
      index: true,
    },
    target_metric: {
      type: String,
      enum: ['SALES_REVENUE', 'LEAD_COUNT', 'CONVERTED_ORDERS', 'PAYMENT_COLLECTION', 'NEW_CUSTOMERS'],
      required: true,
      index: true,
    },
    period_type: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL'],
      default: 'MONTHLY',
    },
    period_label: {
      type: String,
      required: true, // e.g. "Sep 2026" or "Q3 2026"
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    target_value: {
      type: Number,
      required: true,
      min: 0,
    },
    assigned_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assigned_branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    assigned_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    department: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'achieved', 'missed', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

targetGoalSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const TargetGoal = mongoose.model('TargetGoal', targetGoalSchema);
export default TargetGoal;
