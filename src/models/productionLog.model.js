import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const productionLogSchema = new mongoose.Schema(
  {
    log_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    work_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      required: [true, 'Work order is required'],
      index: true,
    },
    log_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    shift: {
      type: String,
      enum: ['Shift A (Morning)', 'Shift B (Evening)', 'Shift C (Night)', 'General'],
      default: 'Shift A (Morning)',
      required: true,
    },
    machine_name: {
      type: String,
      default: 'Assembly Line 1',
    },
    operator_name: {
      type: String,
      default: '',
    },
    quantity_produced: {
      type: Number,
      required: true,
      min: 0,
    },
    scrap_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    downtime_minutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downtime_reason: {
      type: String,
      default: '',
    },
    qc_status: {
      type: String,
      enum: ['pending', 'in_process_passed', 'failed', 'final_qc_passed'],
      default: 'pending',
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

productionLogSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const ProductionLog = mongoose.model('ProductionLog', productionLogSchema);
export default ProductionLog;
