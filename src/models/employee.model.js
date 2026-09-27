import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const employeeSchema = new mongoose.Schema(
  {
    employee_code: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    profile_photo: {
      type: String,
      default: null,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    designation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      default: null,
      index: true,
    },
    reporting_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    joining_date: {
      type: Date,
      default: Date.now,
    },
    employment_type: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'probation'],
      default: 'full_time',
      index: true,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    emergency_contact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    // Sensitive fields (protected from unauthorized exposure)
    bank_account: {
      type: String,
      trim: true,
      default: '',
    },
    ifsc: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    pan: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    uan: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'probation', 'notice_period', 'resigned', 'terminated'],
      default: 'active',
      index: true,
    },
    custom_fields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
