import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const masterDataSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Master category is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Option code is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    color_tag: {
      type: String,
      default: 'indigo',
    },
    sort_order: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

masterDataSchema.index({ category: 1, code: 1 }, { unique: true });

masterDataSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const MasterData = mongoose.model('MasterData', masterDataSchema);
export default MasterData;
