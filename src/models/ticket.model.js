import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const ticketActivitySchema = new mongoose.Schema(
  {
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    activity_type: {
      type: String,
      enum: ['REPLY', 'INTERNAL_NOTE', 'STATUS_CHANGE', 'ESCALATION', 'ASSIGNMENT'],
      default: 'REPLY',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticket_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['QUALITY_DEFECT', 'DELIVERY_DELAY', 'BILLING_DISPUTE', 'WRONG_ITEM', 'COMMUNICATION', 'TECHNICAL', 'OTHER'],
      default: 'QUALITY_DEFECT',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Cross-module traceability links
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
    },
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    dispatch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispatch',
      default: null,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    // SLA Management
    response_due_at: {
      type: Date,
      default: null,
    },
    resolution_due_at: {
      type: Date,
      default: null,
    },
    first_responded_at: {
      type: Date,
      default: null,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
    is_sla_breached: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalation_level: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    resolution_notes: {
      type: String,
      default: '',
    },
    activities: [ticketActivitySchema],
  },
  {
    timestamps: true,
  }
);

ticketSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
