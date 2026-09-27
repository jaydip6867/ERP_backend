import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const channelPartnerSchema = new mongoose.Schema(
  {
    partner_code: {
      type: String,
      required: [true, 'Partner code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    partner_name: {
      type: String,
      required: [true, 'Partner company name is required'],
      trim: true,
      index: true,
    },
    partner_type: {
      type: String,
      enum: ['dealer', 'distributor', 'agent', 'affiliate', 'reseller'],
      default: 'dealer',
      index: true,
    },
    contact_person: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true,
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
    commission_percent: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    gstin: {
      type: String,
      uppercase: true,
      default: '',
    },
    pan: {
      type: String,
      uppercase: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

channelPartnerSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const ChannelPartner = mongoose.model('ChannelPartner', channelPartnerSchema);
export default ChannelPartner;
