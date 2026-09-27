import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const attendanceRecordSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    check_in: {
      type: Date,
      default: null,
    },
    check_out: {
      type: Date,
      default: null,
    },
    work_minutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday'],
      default: 'present',
      index: true,
    },
    source: {
      type: String,
      enum: ['biometric', 'manual', 'portal', 'mobile'],
      default: 'portal',
    },
    remarks: {
      type: String,
      default: '',
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate attendance entries per employee per day
attendanceRecordSchema.index({ employee_id: 1, date: 1 }, { unique: true });

attendanceRecordSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;
