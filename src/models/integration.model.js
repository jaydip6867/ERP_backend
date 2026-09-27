import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Integration name is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['webhook', 'api', 'erp', 'crm', 'payment_gateway', 'whatsapp', 'bi', 'custom'],
      default: 'api',
      index: true,
    },
    base_url: {
      type: String,
      required: true,
      trim: true,
    },
    auth_type: {
      type: String,
      enum: ['bearer', 'api_key', 'basic', 'oauth2', 'none'],
      default: 'bearer',
    },
    // Sensitive credentials - must NEVER be leaked in frontend responses without explicit masking
    credentials: {
      api_key: { type: String, default: '' },
      secret_key: { type: String, default: '' },
      token: { type: String, default: '' },
      username: { type: String, default: '' },
    },
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'testing', 'error'],
      default: 'testing',
      index: true,
    },
    sync_frequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'manual'],
      default: 'realtime',
    },
    last_sync_at: {
      type: Date,
      default: null,
    },
    last_status_code: {
      type: Number,
      default: null,
    },
    error_message: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

integrationSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Integration = mongoose.model('Integration', integrationSchema);
export default Integration;
