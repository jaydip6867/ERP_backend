import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Settings key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    group: {
      type: String,
      enum: ['general', 'company', 'localization', 'security', 'notification', 'taxation', 'sales'],
      default: 'general',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    is_public: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

systemSettingsSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
