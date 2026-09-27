import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const systemHealthLogSchema = new mongoose.Schema(
  {
    service_name: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'down'],
      default: 'healthy',
      index: true,
    },
    latency_ms: {
      type: Number,
      default: 0,
    },
    memory_usage_mb: {
      type: Number,
      default: 0,
    },
    cpu_load_percent: {
      type: Number,
      default: 0,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    checked_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

systemHealthLogSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const SystemHealthLog = mongoose.model('SystemHealthLog', systemHealthLogSchema);
export default SystemHealthLog;
