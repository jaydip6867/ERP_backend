import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const employeeEngagementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['survey', 'event', 'announcement', 'recognition', 'wellness'],
      default: 'event',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    participants_count: {
      type: Number,
      default: 0,
    },
    feedback_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

employeeEngagementSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const EmployeeEngagement = mongoose.model('EmployeeEngagement', employeeEngagementSchema);
export default EmployeeEngagement;
