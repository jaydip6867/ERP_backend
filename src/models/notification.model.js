import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'LEAD_ASSIGNMENT',
        'FOLLOWUP_DUE',
        'QUOTATION_APPROVAL',
        'ORDER_APPROVAL',
        'LOW_STOCK',
        'PURCHASE_APPROVAL',
        'QC_FAILURE',
        'DISPATCH_UPDATE',
        'PAYMENT_DUE',
        'TICKET_SLA',
        'TASK_DUE',
        'MEETING_REMINDER',
        'OWNER_DECISION_PENDING',
        'GENERAL',
      ],
      default: 'GENERAL',
      index: true,
    },
    link_url: {
      type: String,
      default: '',
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    read_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
