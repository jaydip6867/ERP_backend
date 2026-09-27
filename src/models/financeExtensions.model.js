import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

// 1. Cost Center
const costCenterSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    allocated_budget: { type: Number, default: 0 },
    actual_spent: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);
costCenterSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 2. Management Report (MIS)
const managementReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    report_type: {
      type: String,
      enum: ['MONTHLY_MIS', 'BUDGET_VARIANCE', 'CASH_FLOW_PROJECTION', 'COSTING_SUMMARY', 'BOARD_DECK'],
      default: 'MONTHLY_MIS',
      index: true,
    },
    period: { type: String, required: true }, // e.g. "2026-09"
    metrics_summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    prepared_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    file_url: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'approved', 'published'], default: 'published', index: true },
  },
  { timestamps: true }
);
managementReportSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

export const CostCenter = mongoose.model('CostCenter', costCenterSchema);
export const ManagementReport = mongoose.model('ManagementReport', managementReportSchema);

export default {
  CostCenter,
  ManagementReport,
};
