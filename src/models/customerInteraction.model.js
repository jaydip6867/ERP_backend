import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const customerInteractionSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    interaction_type: {
      type: String,
      enum: ['call', 'meeting', 'email', 'site_visit', 'whatsapp', 'support', 'quotation_sent'],
      default: 'call',
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    interaction_date: {
      type: Date,
      default: Date.now,
    },
    conducted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    next_action_date: {
      type: Date,
      default: null,
    },
    outcome: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

customerInteractionSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const CustomerInteraction = mongoose.model('CustomerInteraction', customerInteractionSchema);
export default CustomerInteraction;
