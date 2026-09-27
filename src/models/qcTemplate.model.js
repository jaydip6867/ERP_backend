import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const templateParamSchema = new mongoose.Schema(
  {
    parameter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcParameter',
      required: true,
    },
    standard_spec: {
      type: String,
      default: '',
    },
    min_val: {
      type: Number,
      default: null,
    },
    max_val: {
      type: Number,
      default: null,
    },
    is_mandatory: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const qcTemplateSchema = new mongoose.Schema(
  {
    template_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    template_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    inspection_type: {
      type: String,
      enum: ['incoming', 'in_process', 'final', 'dispatch'],
      required: true,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      default: null,
    },
    sample_size_percent: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    parameters: [templateParamSchema],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

qcTemplateSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const QcTemplate = mongoose.model('QcTemplate', qcTemplateSchema);
export default QcTemplate;
