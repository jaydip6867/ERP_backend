import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const hsnSchema = new mongoose.Schema(
  {
    hsn_code: {
      type: String,
      required: [true, 'HSN code is required'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    gst_rate: {
      type: Number,
      required: [true, 'GST rate is required'],
      min: 0,
      max: 100,
      default: 18,
    },
    effective_from: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

hsnSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Hsn = mongoose.model('Hsn', hsnSchema);
export default Hsn;
