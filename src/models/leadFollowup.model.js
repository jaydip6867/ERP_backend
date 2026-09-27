import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const leadFollowupSchema = new mongoose.Schema(
  {
    lead_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead is required'],
      index: true,
    },
    followup_type: {
      type: String,
      enum: ['call', 'meeting', 'email', 'site_visit', 'whatsapp', 'demo'],
      default: 'call',
      index: true,
    },
    followup_date: {
      type: Date,
      required: [true, 'Follow-up date is required'],
      index: true,
    },
    followup_time: {
      type: String,
      default: '10:00 AM',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
      index: true,
    },
    agenda: {
      type: String,
      required: [true, 'Agenda / Subject is required'],
      trim: true,
    },
    outcome: {
      type: String,
      default: '',
    },
    next_followup_date: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leadFollowupSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const LeadFollowup = mongoose.model('LeadFollowup', leadFollowupSchema);
export default LeadFollowup;
