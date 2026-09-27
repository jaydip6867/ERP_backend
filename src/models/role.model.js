import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const roleSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    role_code: {
      type: String,
      required: [true, 'Role code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    is_system_role: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: false,
  timestamps: true,
});

export const Role = mongoose.model('Role', roleSchema);
export default Role;
