import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

// 1. Printing Job
const printingJobSchema = new mongoose.Schema(
  {
    job_code: { type: String, required: true, uppercase: true, unique: true },
    work_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', default: null },
    sales_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', default: null },
    design_name: { type: String, required: true },
    print_technique: {
      type: String,
      enum: ['SCREEN_PRINTING', 'DIGITAL_DTG', 'SUBLIMATION', 'HEAT_TRANSFER', 'OFFSET'],
      default: 'SCREEN_PRINTING',
    },
    colors_count: { type: Number, default: 1 },
    quantity: { type: Number, required: true, min: 1 },
    completed_qty: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'hold', 'cancelled'],
      default: 'queued',
      index: true,
    },
  },
  { timestamps: true }
);
printingJobSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 2. Embroidery Job
const embroideryJobSchema = new mongoose.Schema(
  {
    job_code: { type: String, required: true, uppercase: true, unique: true },
    work_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', default: null },
    embroidery_type: {
      type: String,
      enum: ['FLAT_THREAD', '3D_PUFF', 'APPLIQUE', 'SEQUIN', 'CHENILLE'],
      default: 'FLAT_THREAD',
    },
    stitches_count: { type: Number, default: 5000 },
    quantity: { type: Number, required: true, min: 1 },
    completed_qty: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'hold', 'cancelled'],
      default: 'queued',
      index: true,
    },
  },
  { timestamps: true }
);
embroideryJobSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 3. Packing Job
const packingJobSchema = new mongoose.Schema(
  {
    job_code: { type: String, required: true, uppercase: true, unique: true },
    sales_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', default: null },
    packaging_type: {
      type: String,
      enum: ['INDIVIDUAL_POLYBAG', 'CORRUGATED_CARTON', 'WOODEN_CRATE', 'CUSTOM_GIFT_BOX', 'PALLETIZED'],
      default: 'CORRUGATED_CARTON',
    },
    total_packages: { type: Number, default: 1 },
    gross_weight_kg: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'packed', 'inspected', 'ready_for_dispatch'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);
packingJobSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 4. Logistics Job
const logisticsJobSchema = new mongoose.Schema(
  {
    consignment_number: { type: String, required: true, uppercase: true, unique: true },
    dispatch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch', default: null },
    carrier_name: { type: String, required: true },
    tracking_number: { type: String, default: '' },
    origin_city: { type: String, required: true },
    destination_city: { type: String, required: true },
    estimated_delivery: { type: Date, default: null },
    actual_delivery: { type: Date, default: null },
    shipping_cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
      default: 'booked',
      index: true,
    },
  },
  { timestamps: true }
);
logisticsJobSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 5. Supply Chain Plan & Operations Project
const supplyChainPlanSchema = new mongoose.Schema(
  {
    plan_name: { type: String, required: true, trim: true },
    month_year: { type: String, required: true }, // e.g. "2026-10"
    projected_demand_qty: { type: Number, default: 0 },
    procurement_budget: { type: Number, default: 0 },
    lead_time_days_average: { type: Number, default: 14 },
    status: { type: String, enum: ['draft', 'approved', 'active', 'closed'], default: 'active', index: true },
  },
  { timestamps: true }
);
supplyChainPlanSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

const operationProjectSchema = new mongoose.Schema(
  {
    project_title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Process Optimization', 'Capacity Expansion', 'Lean Manufacturing', 'Vendor Development', 'Automation'],
      default: 'Process Optimization',
    },
    lead_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['planning', 'active', 'completed', 'on_hold'], default: 'active', index: true },
  },
  { timestamps: true }
);
operationProjectSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

export const PrintingJob = mongoose.model('PrintingJob', printingJobSchema);
export const EmbroideryJob = mongoose.model('EmbroideryJob', embroideryJobSchema);
export const PackingJob = mongoose.model('PackingJob', packingJobSchema);
export const LogisticsJob = mongoose.model('LogisticsJob', logisticsJobSchema);
export const SupplyChainPlan = mongoose.model('SupplyChainPlan', supplyChainPlanSchema);
export const OperationProject = mongoose.model('OperationProject', operationProjectSchema);

export default {
  PrintingJob,
  EmbroideryJob,
  PackingJob,
  LogisticsJob,
  SupplyChainPlan,
  OperationProject,
};
