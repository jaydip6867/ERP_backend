import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const customerAddressSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    address_type: {
      type: String,
      enum: ['billing', 'shipping', 'factory', 'branch', 'registered_office'],
      default: 'billing',
      index: true,
    },
    address_title: {
      type: String,
      default: 'Primary Address',
    },
    address_line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    address_line2: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
    },
    gstin: {
      type: String,
      uppercase: true,
      default: '',
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

customerAddressSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const CustomerAddress = mongoose.model('CustomerAddress', customerAddressSchema);
export default CustomerAddress;
