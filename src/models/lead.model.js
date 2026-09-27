import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const leadSchema = new mongoose.Schema(
  {
    lead_code: {
      type: String,
      required: [true, 'Lead code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    lead_type: {
      type: String,
      enum: ['individual', 'company', 'channel_partner'],
      default: 'company',
    },
    company_name: {
      type: String,
      default: '',
      trim: true,
    },
    contact_name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      index: true,
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
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    lead_source: {
      type: String,
      enum: ['website', 'exhibition', 'referral', 'cold_call', 'social_media', 'inbound_call', 'partner', 'other'],
      default: 'website',
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
    key_account_flag: {
      type: Boolean,
      default: false,
      index: true,
    },
    pipeline_stage: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'new',
      index: true,
    },
    lead_status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
      default: 'new',
      index: true,
    },
    rating: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'warm',
      index: true,
    },
    assigned_to: {
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
    estimated_value: {
      type: Number,
      default: 0,
      min: 0,
    },
    probability_percent: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    expected_closing_date: {
      type: Date,
      default: null,
    },
    lost_reason: {
      type: String,
      enum: ['price_high', 'competitor_chosen', 'feature_missing', 'budget_cancelled', 'no_response', 'delayed_decision', 'other', ''],
      default: '',
    },
    lost_remarks: {
      type: String,
      default: '',
    },
    converted_to_customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    converted_at: {
      type: Date,
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
  },
  {
    timestamps: true,
  }
);

leadSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
