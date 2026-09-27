import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const reworkRecordSchema = new mongoose.Schema(
  {
    rework_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    rework_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    qc_inspection_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcInspection',
      required: true,
      index: true,
    },
    work_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      default: null,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batch_no: {
      type: String,
      default: '',
    },
    rework_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    defect_description: {
      type: String,
      required: true,
    },
    corrective_action_plan: {
      type: String,
      required: true,
    },
    assigned_technician: {
      type: String,
      default: '',
    },
    rework_cost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 're_inspected_pass', 're_inspected_fail'],
      default: 'pending',
      index: true,
    },
    re_inspection_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcInspection',
      default: null,
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

reworkRecordSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const ReworkRecord = mongoose.model('ReworkRecord', reworkRecordSchema);
export default ReworkRecord;
