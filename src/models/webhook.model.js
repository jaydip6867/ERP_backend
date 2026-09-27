import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const webhookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    target_url: {
      type: String,
      required: true,
      trim: true,
    },
    events: {
      type: [String],
      required: true,
      default: ['order.created'],
    },
    secret: {
      type: String,
      default: '',
    },
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused'],
      default: 'active',
      index: true,
    },
    success_count: {
      type: Number,
      default: 0,
    },
    failure_count: {
      type: Number,
      default: 0,
    },
    last_triggered_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

webhookSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Webhook = mongoose.model('Webhook', webhookSchema);
export default Webhook;
