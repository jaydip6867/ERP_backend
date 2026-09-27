import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const todoTaskSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'],
      default: 'TODO',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    due_date: {
      type: Date,
      default: null,
      index: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    is_recurring: {
      type: Boolean,
      default: false,
    },
    recurring_interval: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'NONE'],
      default: 'NONE',
    },
    // Entity Linkages
    related_entity_type: {
      type: String,
      enum: ['Lead', 'Customer', 'SalesOrder', 'Invoice', 'Ticket', 'Meeting', 'None'],
      default: 'None',
    },
    related_entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      refPath: 'related_entity_type',
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

todoTaskSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const TodoTask = mongoose.model('TodoTask', todoTaskSchema);
export default TodoTask;
