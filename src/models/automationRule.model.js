import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const automationConditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in'],
      default: 'equals',
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const automationActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['SEND_WHATSAPP', 'SEND_EMAIL', 'SEND_SMS', 'CREATE_TASK', 'WEBHOOK_POST', 'UPDATE_STATUS', 'NOTIFY_USER'],
      required: true,
    },
    recipient: { type: String, default: '' },
    template: { type: String, default: '' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);

const automationRuleSchema = new mongoose.Schema(
  {
    rule_name: {
      type: String,
      required: [true, 'Automation rule name is required'],
      trim: true,
      index: true,
    },
    trigger_event: {
      type: String,
      required: true,
      enum: [
        'LEAD_CREATED',
        'LEAD_STATUS_CHANGED',
        'QUOTATION_SENT',
        'SALES_ORDER_APPROVED',
        'ORDER_DISPATCHED',
        'INVOICE_GENERATED',
        'PAYMENT_RECEIVED',
        'STOCK_BELOW_REORDER',
        'QC_REJECTED',
        'CUSTOMER_ONBOARDED',
      ],
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    conditions: [automationConditionSchema],
    actions: [automationActionSchema],
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    total_runs: {
      type: Number,
      default: 0,
    },
    last_run_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

automationRuleSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);
export default AutomationRule;
