import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const performanceGoalEvalSchema = new mongoose.Schema(
  {
    goal_title: { type: String, required: true },
    weightage: { type: Number, default: 20 },
    achieved: { type: Boolean, default: false },
    score: { type: Number, default: 3, min: 1, max: 5 },
    remarks: { type: String, default: '' },
  },
  { _id: true }
);

const performanceReviewSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    review_period: {
      type: String,
      required: true,
      index: true, // e.g. "Q3-2026", "Annual-2026"
    },
    reviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goals: [performanceGoalEvalSchema],
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3,
    },
    strengths: {
      type: String,
      default: '',
    },
    improvement_areas: {
      type: String,
      default: '',
    },
    comments: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'acknowledged', 'completed'],
      default: 'draft',
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

performanceReviewSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);
export default PerformanceReview;
