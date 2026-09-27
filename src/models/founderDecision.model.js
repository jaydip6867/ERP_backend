import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const decisionLogActionSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['APPROVE', 'REJECT', 'DEFER', 'COMMENT', 'CREATE_TASK'],
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: {
      type: String,
      default: '',
    },
    action_date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const founderDecisionSchema = new mongoose.Schema(
  {
    decision_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'HIGH_VALUE_ORDER',
        'HIGH_DISCOUNT_REQUEST',
        'CREDIT_APPROVAL',
        'LARGE_PURCHASE',
        'CASH_RISK',
        'INVENTORY_RISK',
        'PROFIT_RISK',
        'CUSTOMER_RISK',
        'BUSINESS_OPPORTUNITY',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    impact_amount: {
      type: Number,
      default: 0,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    related_entity_type: {
      type: String,
      enum: ['SalesOrder', 'Quotation', 'Customer', 'PurchaseOrder', 'Product', 'None'],
      default: 'None',
    },
    related_entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      refPath: 'related_entity_type',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED'],
      default: 'PENDING',
      index: true,
    },
    action_logs: [decisionLogActionSchema],
  },
  {
    timestamps: true,
  }
);

founderDecisionSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const FounderDecision = mongoose.model('FounderDecision', founderDecisionSchema);
export default FounderDecision;
