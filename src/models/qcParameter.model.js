import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const qcParameterSchema = new mongoose.Schema(
  {
    param_name: {
      type: String,
      required: [true, 'Parameter name is required'],
      trim: true,
      index: true,
    },
    param_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['dimensional', 'visual', 'chemical', 'mechanical', 'electrical', 'packaging', 'other'],
      default: 'dimensional',
    },
    data_type: {
      type: String,
      enum: ['numeric_range', 'boolean', 'text'],
      default: 'numeric_range',
    },
    standard_value: {
      type: String,
      default: '',
    },
    min_tolerance: {
      type: Number,
      default: null,
    },
    max_tolerance: {
      type: Number,
      default: null,
    },
    unit_of_measure: {
      type: String,
      default: 'mm',
    },
    test_method: {
      type: String,
      default: 'Vernier Caliper / Gauge / Visual inspection',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

qcParameterSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const QcParameter = mongoose.model('QcParameter', qcParameterSchema);
export default QcParameter;
