import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const workOrderSchema = new mongoose.Schema(
  {
    wo_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    wo_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Finished Good product is required'],
      index: true,
    },
    bom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bom',
      required: [true, 'BOM is required'],
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      description: 'Destination warehouse for finished goods',
    },
    raw_material_warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      description: 'Source warehouse for raw materials',
    },
    planned_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    produced_qty: {
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
    planned_start_date: {
      type: Date,
      default: Date.now,
    },
    planned_end_date: {
      type: Date,
      default: null,
    },
    actual_start_date: {
      type: Date,
      default: null,
    },
    actual_end_date: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'draft',
        'planned',
        'materials_issued',
        'in_production',
        'qc_in_progress',
        'completed',
        'cancelled',
        'on_hold',
      ],
      default: 'draft',
      index: true,
    },
    assigned_supervisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    target_batch_number: {
      type: String,
      default: '',
    },
    finished_batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
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

workOrderSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
export default WorkOrder;
