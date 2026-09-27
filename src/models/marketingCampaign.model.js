import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const campaignSpendSchema = new mongoose.Schema(
  {
    spend_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    channel: {
      type: String,
      enum: ['GOOGLE_ADS', 'FACEBOOK_INSTAGRAM', 'LINKEDIN', 'EMAIL_BLAST', 'EXHIBITION', 'PRINT_MEDIA', 'WHATSAPP_CAMPAIGN'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const marketingTemplateSchema = new mongoose.Schema(
  {
    template_name: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'WHATSAPP', 'SMS'],
      required: true,
    },
    subject: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    placeholders: [String],
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const marketingCampaignSchema = new mongoose.Schema(
  {
    campaign_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    campaign_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    campaign_type: {
      type: String,
      enum: ['EMAIL', 'EXHIBITION', 'DIGITAL_ADS', 'WEBINAR', 'DIRECT_OUTREACH', 'SEASONAL_PROMO'],
      default: 'DIGITAL_ADS',
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    total_spend: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'paused', 'completed'],
      default: 'active',
      index: true,
    },
    target_audience: {
      type: String,
      default: '',
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    content_type: {
      type: String,
      default: 'GENERAL',
      trim: true,
    },
    marketing_department_owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    spends: [campaignSpendSchema],
    templates: [marketingTemplateSchema],
  },
  {
    timestamps: true,
  }
);

marketingCampaignSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const MarketingCampaign = mongoose.model('MarketingCampaign', marketingCampaignSchema);
export default MarketingCampaign;
