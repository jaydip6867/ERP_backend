import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const customerFeedbackSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    ticket_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
    },
    nps_score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    rating_category: {
      type: String,
      enum: ['PROMOTER', 'PASSIVE', 'DETRACTOR'],
      required: true,
    },
    feedback_text: {
      type: String,
      default: '',
    },
    sentiment: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
      default: 'NEUTRAL',
    },
  },
  {
    timestamps: true,
  }
);

customerFeedbackSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const CustomerFeedback = mongoose.model('CustomerFeedback', customerFeedbackSchema);
export default CustomerFeedback;
