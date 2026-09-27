import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const hrPolicySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['General Conduct', 'Leave & Attendance', 'Compensation & Benefits', 'Workplace Safety', 'IT & Security', 'POSH', 'Travel'],
      default: 'General Conduct',
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: 'v1.0',
    },
    effective_date: {
      type: Date,
      default: Date.now,
    },
    document_url: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

hrPolicySchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const HrPolicy = mongoose.model('HrPolicy', hrPolicySchema);
export default HrPolicy;
