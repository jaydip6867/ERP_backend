import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const automationRunSchema = new mongoose.Schema(
  {
    rule_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutomationRule',
      required: true,
      index: true,
    },
    rule_name: {
      type: String,
      default: '',
    },
    event_name: {
      type: String,
      required: true,
      index: true,
    },
    entity_type: {
      type: String,
      default: '',
    },
    entity_id: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      default: 'success',
      index: true,
    },
    execution_time_ms: {
      type: Number,
      default: 0,
    },
    logs: {
      type: String,
      default: '',
    },
    error_details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    executed_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

automationRunSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const AutomationRun = mongoose.model('AutomationRun', automationRunSchema);
export default AutomationRun;
