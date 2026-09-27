import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const customerDocumentSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    doc_type: {
      type: String,
      enum: ['gst_certificate', 'pan_card', 'msme', 'bank_statement', 'incorporation', 'trade_license', 'other'],
      required: [true, 'Document type is required'],
      index: true,
    },
    doc_number: {
      type: String,
      default: '',
      trim: true,
    },
    file_name: {
      type: String,
      required: [true, 'File name is required'],
    },
    file_url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    verification_status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
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
    verification_remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

customerDocumentSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const CustomerDocument = mongoose.model('CustomerDocument', customerDocumentSchema);
export default CustomerDocument;
