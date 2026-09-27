import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const interviewSchema = new mongoose.Schema(
  {
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    job_opening_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: true,
      index: true,
    },
    interviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interview_round: {
      type: String,
      default: 'Round 1 - Technical & Competency',
      trim: true,
    },
    scheduled_at: {
      type: Date,
      required: true,
      index: true,
    },
    feedback: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    result: {
      type: String,
      enum: ['pending', 'recommended', 'rejected', 'on_hold'],
      default: 'pending',
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

interviewSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
