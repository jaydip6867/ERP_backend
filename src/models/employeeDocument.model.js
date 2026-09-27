import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const employeeDocumentSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    document_type: {
      type: String,
      required: true,
      enum: ['Aadhar', 'PAN', 'Passport', 'Offer Letter', 'Contract', 'Degree Certificate', 'Relieving Letter', 'Other'],
      default: 'Other',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verified_at: {
      type: Date,
      default: null,
    },
    expiry_date: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

employeeDocumentSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const EmployeeDocument = mongoose.model('EmployeeDocument', employeeDocumentSchema);
export default EmployeeDocument;
