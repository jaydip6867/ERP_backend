import mongoose from 'mongoose';
import { DATA_SCOPES } from '../constants/modules.js';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const rolePermissionSchema = new mongoose.Schema(
  {
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required'],
      index: true,
    },
    module: {
      type: String,
      required: [true, 'Module code is required'],
      trim: true,
      index: true,
    },
    can_view: {
      type: Boolean,
      default: false,
    },
    can_create: {
      type: Boolean,
      default: false,
    },
    can_edit: {
      type: Boolean,
      default: false,
    },
    can_delete: {
      type: Boolean,
      default: false,
    },
    can_approve: {
      type: Boolean,
      default: false,
    },
    can_export: {
      type: Boolean,
      default: false,
    },
    can_print: {
      type: Boolean,
      default: false,
    },
    can_view_cost: {
      type: Boolean,
      default: false,
    },
    can_view_salary: {
      type: Boolean,
      default: false,
    },
    can_run_automation: {
      type: Boolean,
      default: false,
    },
    can_manage_integrations: {
      type: Boolean,
      default: false,
    },
    data_scope: {
      type: String,
      enum: Object.values(DATA_SCOPES),
      default: DATA_SCOPES.OWN,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one permission document per module per role
rolePermissionSchema.index({ role_id: 1, module: 1 }, { unique: true });

rolePermissionSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: false,
  timestamps: true,
});

export const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);
export default RolePermission;
