import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const employeeGoalSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Operational', 'Strategic', 'Skill Development', 'Leadership', 'Sales Target'],
      default: 'Operational',
    },
    target_date: {
      type: Date,
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'achieved', 'deferred', 'cancelled'],
      default: 'not_started',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

employeeGoalSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const EmployeeGoal = mongoose.model('EmployeeGoal', employeeGoalSchema);
export default EmployeeGoal;
