import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const companySchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    legal_name: {
      type: String,
      trim: true,
      default: '',
    },
    cin: {
      type: String,
      trim: true,
      default: '',
    },
    pan: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      default: null,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currency_symbol: {
      type: String,
      default: '₹',
    },
    financial_year_start: {
      type: String,
      default: '04-01',
    },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

companySchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Company = mongoose.model('Company', companySchema);
export default Company;
