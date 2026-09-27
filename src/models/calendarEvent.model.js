import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    event_type: {
      type: String,
      enum: ['MEETING', 'FOLLOWUP', 'TASK_DEADLINE', 'REMINDER', 'DELIVERY_DISPATCH', 'BIRTHDAY'],
      default: 'REMINDER',
      index: true,
    },
    start_time: {
      type: Date,
      required: true,
      index: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    is_all_day: {
      type: Boolean,
      default: false,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#4f46e5',
    },
  },
  {
    timestamps: true,
  }
);

calendarEventSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);
export default CalendarEvent;
