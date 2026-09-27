import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const candidateSchema = new mongoose.Schema(
  {
    job_opening_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    resume_file: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'LinkedIn',
      trim: true,
    },
    experience: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    expected_salary: {
      type: Number,
      default: 0,
    },
    notice_period: {
      type: Number,
      default: 30, // in days
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview_scheduled', 'offered', 'rejected', 'hired'],
      default: 'applied',
      index: true,
    },
    assigned_recruiter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

candidateSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;
