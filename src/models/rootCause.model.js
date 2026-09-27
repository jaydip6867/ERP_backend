import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const rootCauseSchema = new mongoose.Schema(
  {
    ticket_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    defect_type: {
      type: String,
      required: true,
    },
    root_cause_analysis: {
      type: String,
      required: true,
    },
    five_why_analysis: [
      {
        why_step: Number,
        question: String,
        answer: String,
      },
    ],
    corrective_action: {
      type: String,
      required: true,
    },
    preventive_action: {
      type: String,
      required: true,
    },
    responsible_person_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    target_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_INVESTIGATION', 'IMPLEMENTED', 'VERIFIED_EFFECTIVE', 'CLOSED'],
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

rootCauseSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const RootCause = mongoose.model('RootCause', rootCauseSchema);
export default RootCause;
