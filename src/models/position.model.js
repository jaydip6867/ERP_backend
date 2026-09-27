import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const positionSchema = new mongoose.Schema(
  {
    position_code: {
      type: String,
      required: [true, 'Position code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    position_name: {
      type: String,
      required: [true, 'Position name is required'],
      trim: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    reports_to_position_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      default: null,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    custom_fields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

positionSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Position = mongoose.model('Position', positionSchema);
export default Position;
