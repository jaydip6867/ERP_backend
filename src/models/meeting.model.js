import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const meetingActionItemSchema = new mongoose.Schema(
  {
    task_description: {
      type: String,
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    due_date: {
      type: Date,
      default: null,
    },
    is_created_as_todo: {
      type: Boolean,
      default: false,
    },
    todo_task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TodoTask',
      default: null,
    },
  },
  { _id: true }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    meeting_date: {
      type: Date,
      required: true,
      index: true,
    },
    duration_minutes: {
      type: Number,
      default: 60,
    },
    location_or_link: {
      type: String,
      default: 'Boardroom / Google Meet',
    },
    organizer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendees: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['ACCEPTED', 'TENTATIVE', 'DECLINED', 'INVITED'],
          default: 'ACCEPTED',
        },
      },
    ],
    agenda: {
      type: String,
      default: '',
    },
    minutes_of_meeting: {
      type: String,
      default: '',
    },
    decisions_taken: [String],
    action_items: [meetingActionItemSchema],
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

meetingSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
