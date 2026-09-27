import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const trainingProgramSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    trainer_name: {
      type: String,
      default: '',
    },
    trainer_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      default: 20,
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
      default: 'upcoming',
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

trainingProgramSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

const trainingRecordSchema = new mongoose.Schema(
  {
    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingProgram',
      required: true,
      index: true,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    attendance_rate: {
      type: Number,
      default: 100, // percentage
    },
    score: {
      type: Number,
      default: 0,
    },
    completion_status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'failed', 'dropped'],
      default: 'enrolled',
      index: true,
    },
    certificate_url: {
      type: String,
      default: '',
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

trainingRecordSchema.index({ program_id: 1, employee_id: 1 }, { unique: true });

trainingRecordSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const TrainingProgram = mongoose.model('TrainingProgram', trainingProgramSchema);
export const TrainingRecord = mongoose.model('TrainingRecord', trainingRecordSchema);
export default { TrainingProgram, TrainingRecord };
