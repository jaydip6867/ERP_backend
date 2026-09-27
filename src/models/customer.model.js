import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const customerSchema = new mongoose.Schema(
  {
    customer_code: {
      type: String,
      required: [true, 'Customer code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    company_name: {
      type: String,
      required: [true, 'Company / Customer name is required'],
      trim: true,
      index: true,
    },
    customer_type: {
      type: String,
      enum: ['retail', 'dealer', 'distributor', 'corporate', 'institutional'],
      default: 'dealer',
      index: true,
    },
    gstin: {
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
    email: {
      type: String,
      lowercase: true,
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
    credit_limit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit_days: {
      type: Number,
      default: 30,
      min: 0,
    },
    credit_status: {
      type: String,
      enum: ['approved', 'pending', 'hold', 'rejected'],
      default: 'pending',
      index: true,
    },
    price_list_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PriceList',
      default: null,
    },
    sales_person_id: {
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
    segment: {
      type: String,
      enum: ['Platinum', 'Gold', 'Silver', 'Bronze', 'General'],
      default: 'General',
      index: true,
    },
    sales_segment: {
      type: String,
      default: 'B2B',
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    account_type: {
      type: String,
      default: 'standard',
      trim: true,
    },
    key_account: {
      type: Boolean,
      default: false,
      index: true,
    },
    contract_start_date: {
      type: Date,
      default: null,
    },
    contract_end_date: {
      type: Date,
      default: null,
    },
    multi_location: {
      type: Boolean,
      default: false,
    },
    account_owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    stage: {
      type: String,
      enum: ['prospect', 'active', 'dormant', 'inactive'],
      default: 'active',
      index: true,
    },
    outstanding_balance: {
      type: Number,
      default: 0,
    },
    total_orders_count: {
      type: Number,
      default: 0,
    },
    last_order_date: {
      type: Date,
      default: null,
    },
    last_interaction_date: {
      type: Date,
      default: null,
    },
    merged_into_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: '',
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

customerSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
