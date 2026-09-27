import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const taxRateSchema = new mongoose.Schema(
  {
    tax_name: {
      type: String,
      required: [true, 'Tax name is required'],
      trim: true,
      index: true,
    },
    tax_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    total_rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    cgst_rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sgst_rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    igst_rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    cess_rate: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

taxRateSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const TaxRate = mongoose.model('TaxRate', taxRateSchema);
export default TaxRate;
