import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const biReportSchema = new mongoose.Schema(
  {
    report_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Sales & Revenue', 'Financial Analytics', 'Operations & Production', 'Customer Retention', 'Executive Cockpit', 'Custom BI'],
      default: 'Sales & Revenue',
      index: true,
    },
    chart_type: {
      type: String,
      enum: ['bar', 'line', 'pie', 'doughnut', 'area', 'table', 'kpi_card'],
      default: 'bar',
    },
    dataset_key: {
      type: String,
      required: true,
      default: 'monthly_sales',
    },
    configuration: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    is_public_dashboard: {
      type: Boolean,
      default: false,
    },
    refresh_interval_minutes: {
      type: Number,
      default: 60,
    },
    last_generated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

biReportSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const BiReport = mongoose.model('BiReport', biReportSchema);
export default BiReport;
