import { z } from 'zod';
import { DATA_SCOPES, MODULE_CODES } from '../constants/modules.js';

export const createRoleSchema = z.object({
  role_name: z.string().min(2, 'Role name must be at least 2 characters').trim(),
  role_code: z
    .string()
    .min(2, 'Role code must be at least 2 characters')
    .regex(/^[A-Z0-9_]+$/, 'Role code must contain only uppercase letters, numbers, and underscores')
    .trim(),
  description: z.string().optional().default(''),
  is_system_role: z.boolean().optional().default(false),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateRoleSchema = z.object({
  role_name: z.string().min(2, 'Role name must be at least 2 characters').trim().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const permissionItemSchema = z.object({
  module: z.enum(MODULE_CODES, {
    errorMap: () => ({ message: 'Invalid or unsupported module code' }),
  }),
  can_view: z.boolean().default(false),
  can_create: z.boolean().default(false),
  can_edit: z.boolean().default(false),
  can_delete: z.boolean().default(false),
  can_approve: z.boolean().default(false),
  can_export: z.boolean().default(false),
  can_print: z.boolean().default(false),
  can_view_cost: z.boolean().default(false),
  data_scope: z.enum(Object.values(DATA_SCOPES)).default(DATA_SCOPES.OWN),
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(permissionItemSchema).min(1, 'At least one module permission must be provided'),
});
