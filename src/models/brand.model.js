import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const brandSchema = new mongoose.Schema(
  {
    brand_name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    brand_code: {
      type: String,
      required: [true, 'Brand code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: null,
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

brandSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
