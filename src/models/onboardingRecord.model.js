import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const onboardingChecklistSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const onboardingRecordSchema = new mongoose.Schema(
  {
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    target_completion_date: {
      type: Date,
      default: null,
    },
    checklist: [onboardingChecklistSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    notes: {
      type: String,
      default: '',
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

onboardingRecordSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const OnboardingRecord = mongoose.model('OnboardingRecord', onboardingRecordSchema);
export default OnboardingRecord;
