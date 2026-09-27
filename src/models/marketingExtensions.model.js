import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

// 1. Marketing Asset (Photos, Videos, Brand Guidelines)
const marketingAssetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    asset_type: {
      type: String,
      enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'LOGO', 'CATALOGUE', 'BRAND_GUIDELINES'],
      default: 'IMAGE',
    },
    category: {
      type: String,
      enum: ['Brand', 'Digital Marketing', 'Performance', 'Social Media', 'Photo/Video', 'Physical', 'Catalogue'],
      default: 'Brand',
      index: true,
    },
    file_url: { type: String, required: true },
    thumbnail_url: { type: String, default: '' },
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
    tags: [String],
    file_size_kb: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);
marketingAssetSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 2. Content Item (Copy, Social Posts, Articles, Scripts)
const contentItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ['INSTAGRAM', 'LINKEDIN', 'YOUTUBE', 'BLOG', 'EMAIL', 'WHATSAPP', 'PRINT'],
      default: 'INSTAGRAM',
    },
    content_text: { type: String, required: true },
    scheduled_date: { type: Date, default: null },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);
contentItemSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 3. Creative Request (Designers & Photographers)
const creativeRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    brief: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    due_date: { type: Date, default: null },
    status: {
      type: String,
      enum: ['submitted', 'in_progress', 'review', 'completed', 'cancelled'],
      default: 'submitted',
      index: true,
    },
  },
  { timestamps: true }
);
creativeRequestSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 4. Physical Marketing Activity (Exhibitions, Signages, Hoardings, Retail Merchandising)
const physicalMarketingActivitySchema = new mongoose.Schema(
  {
    activity_name: { type: String, required: true, trim: true },
    activity_type: {
      type: String,
      enum: ['EXHIBITION', 'OUTDOOR_HOARDING', 'RETAIL_SIGNAGE', 'POP_DISPLAY', 'EVENT_SPONSORSHIP'],
      default: 'EXHIBITION',
    },
    location: { type: String, required: true },
    cost: { type: Number, default: 0 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    expected_footfall: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'],
      default: 'planning',
      index: true,
    },
  },
  { timestamps: true }
);
physicalMarketingActivitySchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

export const MarketingAsset = mongoose.model('MarketingAsset', marketingAssetSchema);
export const ContentItem = mongoose.model('ContentItem', contentItemSchema);
export const CreativeRequest = mongoose.model('CreativeRequest', creativeRequestSchema);
export const PhysicalMarketingActivity = mongoose.model('PhysicalMarketingActivity', physicalMarketingActivitySchema);

export default {
  MarketingAsset,
  ContentItem,
  CreativeRequest,
  PhysicalMarketingActivity,
};
