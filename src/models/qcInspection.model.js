import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const qcResultSchema = new mongoose.Schema(
  {
    parameter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcParameter',
      default: null,
    },
    parameter_name: {
      type: String,
      required: true,
    },
    standard_spec: {
      type: String,
      default: '',
    },
    observed_value: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ['PASS', 'FAIL'],
      default: 'PASS',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const qcInspectionSchema = new mongoose.Schema(
  {
    inspection_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    inspection_type: {
      type: String,
      enum: ['incoming', 'in_process', 'final', 'dispatch'],
      required: true,
      index: true,
    },
    source_document_type: {
      type: String,
      enum: ['GRN', 'WORK_ORDER', 'PRODUCTION_LOG', 'DISPATCH', 'SALES_RETURN'],
      required: true,
      index: true,
    },
    source_document_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    source_document_no: {
      type: String,
      required: true,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    batch_no: {
      type: String,
      default: '',
      trim: true,
    },
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcTemplate',
      default: null,
    },
    sample_size: {
      type: Number,
      required: true,
      min: 1,
    },
    total_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    accepted_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejected_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    rework_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    outcome: {
      type: String,
      enum: ['PASS', 'FAIL', 'REWORK', 'SCRAP', 'PENDING'],
      default: 'PENDING',
      index: true,
    },
    inspector_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inspection_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    results: [qcResultSchema],
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

qcInspectionSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const QcInspection = mongoose.model('QcInspection', qcInspectionSchema);
export default QcInspection;
