import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const supplierSchema = new mongoose.Schema(
  {
    supplier_name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      index: true,
    },
    supplier_code: {
      type: String,
      required: [true, 'Supplier code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    contact_person: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    mobile: {
      type: String,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['raw_materials', 'consumables', 'machinery', 'services', 'packaging', 'general'],
      default: 'raw_materials',
    },
    address: {
      address_line1: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    payment_terms: {
      type: String,
      default: 'Net 30 Days',
    },
    bank_details: {
      bank_name: String,
      account_number: String,
      ifsc_code: String,
      branch: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },
    current_balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blacklisted'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

supplierSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
