import { DATA_SCOPES, ERP_MODULES, PERMISSION_ACTIONS } from '../constants/modules.js';
import { Role } from '../models/role.model.js';
import { RolePermission } from '../models/rolePermission.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/appError.js';

/**
 * Check if a role code is considered superuser (full system access).
 * @param {string} roleCode
 * @returns {boolean}
 */
export const isSuperRole = (roleCode) => {
  if (!roleCode) return false;
  const upper = roleCode.toUpperCase();
  return (
    upper === 'OWNER' ||
    upper === 'ADMIN' ||
    upper === 'SUPER_ADMIN' ||
    upper === 'FOUNDER' ||
    upper === 'BOARD_FOUNDER' ||
    upper === 'BOARD / FOUNDER' ||
    upper === 'CEO'
  );
};

/**
 * Build full access permission set for Owner/Admin roles.
 */
export const getFullAccessPermissions = () => {
  return ERP_MODULES.map((mod) => ({
    module: mod.code,
    module_name: mod.name,
    category: mod.category,
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: true,
    can_approve: true,
    can_export: true,
    can_print: true,
    can_view_cost: true,
    can_view_salary: true,
    can_run_automation: true,
    can_manage_integrations: true,
    data_scope: DATA_SCOPES.ALL,
  }));
};

/**
 * Get all permissions for a user including module metadata.
 * @param {object} user
 * @returns {Promise<Array>}
 */
export const getUserPermissions = async (user) => {
  let roleCode = '';

  if (user.role_id) {
    if (user.role_id.role_code) {
      roleCode = user.role_id.role_code;
    } else {
      const role = await Role.findById(user.role_id);
      if (role) roleCode = role.role_code;
    }
  }

  // Owner & Main Admin have full unrestricted access across all modules
  if (isSuperRole(roleCode)) {
    return getFullAccessPermissions();
  }

  if (!user.role_id) {
    return [];
  }

  const roleId = user.role_id._id || user.role_id;
  const storedPermissions = await RolePermission.find({ role_id: roleId });

  // Map to full modules list so UI always gets all ERP modules
  return ERP_MODULES.map((mod) => {
    const existing = storedPermissions.find((p) => p.module === mod.code);
    return {
      module: mod.code,
      module_name: mod.name,
      category: mod.category,
      can_view: Boolean(existing?.can_view),
      can_create: Boolean(existing?.can_create),
      can_edit: Boolean(existing?.can_edit),
      can_delete: Boolean(existing?.can_delete),
      can_approve: Boolean(existing?.can_approve),
      can_export: Boolean(existing?.can_export),
      can_print: Boolean(existing?.can_print),
      can_view_cost: Boolean(existing?.can_view_cost),
      can_view_salary: Boolean(existing?.can_view_salary),
      can_run_automation: Boolean(existing?.can_run_automation),
      can_manage_integrations: Boolean(existing?.can_manage_integrations),
      data_scope: existing?.data_scope || DATA_SCOPES.OWN,
    };
  });
};

/**
 * Check if user is authorized for a specific module and action.
 *
 * @param {object} user - Authenticated user document
 * @param {string} moduleCode - Target module (e.g. 'inventory', 'sales', 'roles')
 * @param {string} action - Action ('can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve', etc.)
 * @returns {Promise<{ granted: boolean, dataScope: string, permission?: object }>}
 */
export const checkAuthorization = async (user, moduleCode, action = 'can_view') => {
  if (!user || user.status !== 'active') {
    return { granted: false, reason: 'Inactive user' };
  }

  let role = null;
  if (user.role_id) {
    if (user.role_id.role_code) {
      role = user.role_id;
    } else {
      role = await Role.findById(user.role_id);
    }
  }

  // 1. Owner & Admin have unrestricted superuser access
  if (role && isSuperRole(role.role_code)) {
    return {
      granted: true,
      dataScope: DATA_SCOPES.ALL,
      isSuperuser: true,
    };
  }

  if (!role || role.status !== 'active') {
    return { granted: false, reason: 'No active role assigned' };
  }

  // Normalize module name
  const aliasMap = {
    product: 'inventory',
    products: 'inventory',
    inventory: 'inventory',
    customer: 'sales',
    customers: 'sales',
    lead: 'marketing',
    leads: 'marketing',
    quotation: 'sales',
    quotations: 'sales',
    sale: 'sales',
    sales: 'sales',
    salesorder: 'sales',
    sales_order: 'sales',
    salesorders: 'sales',
    sales_orders: 'sales',
    inventory: 'inventory',
    stock: 'inventory',
    stockledger: 'inventory',
    batch: 'inventory',
    batches: 'inventory',
    transfer: 'inventory',
    transfers: 'inventory',
    adjustment: 'inventory',
    adjustments: 'inventory',
    supplier: 'procurement',
    suppliers: 'procurement',
    procurement: 'procurement',
    purchase: 'procurement',
    purchaserequisition: 'procurement',
    purchaseorder: 'procurement',
    grn: 'procurement',
    purchaseinvoice: 'procurement',
    purchasereturn: 'procurement',
    production: 'production',
    workorder: 'production',
    workorders: 'production',
    materialissue: 'production',
    productionlog: 'production',
    scrap: 'production',
    quality: 'quality',
    qc: 'quality',
    qcinspection: 'quality',
    qcparameter: 'quality',
    qctemplate: 'quality',
    rework: 'quality',
    dispatch: 'sales',
    dispatches: 'sales',
    transporter: 'sales',
    transporters: 'sales',
    salesreturn: 'sales',
    salesreturns: 'sales',
    invoice: 'finance',
    invoices: 'finance',
    creditnote: 'finance',
    debitnote: 'finance',
    tax: 'finance',
    gst: 'finance',
    user: 'users',
    users: 'users',
    role: 'roles',
    roles: 'roles',
    setting: 'settings',
    settings: 'settings',
    department: 'organization',
    departments: 'organization',
    position: 'organization',
    positions: 'organization',
    organization: 'organization',
    employee: 'hr',
    employees: 'hr',
    recruitment: 'hr',
    job_opening: 'hr',
    candidate: 'hr',
    candidates: 'hr',
    interview: 'hr',
    interviews: 'hr',
    onboarding: 'hr',
    attendance: 'hr',
    leave: 'hr',
    payroll: 'hr',
    training: 'hr',
    performance: 'hr',
    goal: 'hr',
    goals: 'hr',
    policy: 'hr',
    policies: 'hr',
    engagement: 'hr',
    hr: 'hr',
    tech: 'technology',
    technology: 'technology',
    automation: 'technology',
    integration: 'technology',
    integrations: 'technology',
    webhook: 'technology',
    webhooks: 'technology',
    rnd: 'rnd',
    research: 'rnd',
    npd: 'rnd',
    operation: 'operations',
    operations: 'operations',
    job: 'operations',
    jobs: 'operations',
    dashboard: 'dashboard',
    dashboards: 'dashboards',
  };
  const normalizedModule = aliasMap[moduleCode?.toLowerCase()] || moduleCode;

  // 2. Query module permissions for role
  const permission = await RolePermission.findOne({
    role_id: role._id,
    module: { $in: [moduleCode, normalizedModule] },
  });

  if (!permission || !permission[action]) {
    return {
      granted: false,
      reason: `Action '${action}' on module '${moduleCode}' is not permitted for role '${role.role_name}'.`,
    };
  }

  return {
    granted: true,
    dataScope: permission.data_scope || DATA_SCOPES.OWN,
    permission,
  };
};

/**
 * Constructs MongoDB query filters according to data-scope policies:
 * - ALL: No filter applied
 * - BRANCH: Filters by user's branch_id
 * - TEAM: Filters by user, assigned team members, or direct reports
 * - OWN: Filters strictly by user's ownership/assignment
 *
 * @param {object} user
 * @param {string} dataScope - 'OWN' | 'TEAM' | 'BRANCH' | 'ALL'
 * @param {object} [options={}]
 * @returns {Promise<object>} MongoDB filter query object
 */
export const buildDataScopeFilter = async (user, dataScope, options = {}) => {
  const {
    ownerField = 'created_by',
    assignedField = 'assigned_to',
    branchField = 'branch_id',
    teamField = 'department',
  } = options;

  const userId = user._id || user.id;

  switch (dataScope) {
    case DATA_SCOPES.ALL:
      return {};

    case DATA_SCOPES.BRANCH:
      if (!user.branch_id) {
        // If user has no branch set, restrict to own records for safety
        return { [ownerField]: userId };
      }
      return { [branchField]: user.branch_id };

    case DATA_SCOPES.TEAM: {
      // Find all team members reporting to this user or in the same department
      const teamUserIds = [userId];

      try {
        const teamMembers = await User.find({
          $or: [
            { reporting_manager_id: userId },
            ...(user.department ? [{ department: user.department }] : []),
          ],
        }).select('_id');

        teamMembers.forEach((member) => teamUserIds.push(member._id));
      } catch (e) {
        // Fallback to userId
      }

      return {
        $or: [
          { [ownerField]: { $in: teamUserIds } },
          { [assignedField]: { $in: teamUserIds } },
          ...(user.department ? [{ [teamField]: user.department }] : []),
        ],
      };
    }

    case DATA_SCOPES.OWN:
    default:
      return {
        $or: [
          { [ownerField]: userId },
          { [assignedField]: userId },
        ],
      };
  }
};

/**
 * Role CRUD & Permission management operations
 */
export const getAllRoles = async ({ status, search, page = 1, limit = 50 }) => {
  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (search) {
    filter.$or = [
      { role_name: { $regex: search, $options: 'i' } },
      { role_code: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [roles, total] = await Promise.all([
    Role.find(filter).sort({ is_system_role: -1, role_name: 1 }).skip(skip).limit(limit),
    Role.countDocuments(filter),
  ]);

  return { roles, total, page, limit };
};

export const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) {
    throw AppError.notFound('Role not found');
  }
  return role;
};

export const createRole = async (data) => {
  const existing = await Role.findOne({ role_code: data.role_code.toUpperCase() });
  if (existing) {
    throw AppError.conflict(`Role with code '${data.role_code}' already exists`);
  }

  const role = await Role.create({
    role_name: data.role_name,
    role_code: data.role_code.toUpperCase(),
    description: data.description || '',
    is_system_role: Boolean(data.is_system_role),
    status: data.status || 'active',
  });

  return role;
};

export const updateRole = async (id, data) => {
  const role = await Role.findById(id);
  if (!role) {
    throw AppError.notFound('Role not found');
  }

  if (role.is_system_role && data.role_code && data.role_code !== role.role_code) {
    throw AppError.badRequest('System role codes cannot be modified');
  }

  if (data.role_name !== undefined) role.role_name = data.role_name;
  if (data.description !== undefined) role.description = data.description;
  if (data.status !== undefined) role.status = data.status;

  await role.save();
  return role;
};

/**
 * Get permission matrix for a specific role.
 * @param {string} roleId
 * @returns {Promise<{ role: object, permissions: Array }>}
 */
export const getRolePermissions = async (roleId) => {
  const role = await getRoleById(roleId);

  // If Owner or Admin, return all permissions enabled
  if (isSuperRole(role.role_code)) {
    return {
      role,
      permissions: getFullAccessPermissions(),
    };
  }

  const stored = await RolePermission.find({ role_id: roleId });

  const permissions = ERP_MODULES.map((mod) => {
    const existing = stored.find((p) => p.module === mod.code);
    return {
      module: mod.code,
      module_name: mod.name,
      category: mod.category,
      can_view: Boolean(existing?.can_view),
      can_create: Boolean(existing?.can_create),
      can_edit: Boolean(existing?.can_edit),
      can_delete: Boolean(existing?.can_delete),
      can_approve: Boolean(existing?.can_approve),
      can_export: Boolean(existing?.can_export),
      can_print: Boolean(existing?.can_print),
      can_view_cost: Boolean(existing?.can_view_cost),
      data_scope: existing?.data_scope || DATA_SCOPES.OWN,
    };
  });

  return { role, permissions };
};

/**
 * Upsert permissions matrix for a role.
 *
 * @param {string} roleId
 * @param {Array} permissionsArray
 * @returns {Promise<{ role: object, permissions: Array }>}
 */
export const updateRolePermissions = async (roleId, permissionsArray) => {
  const role = await getRoleById(roleId);

  const operations = permissionsArray.map((perm) => {
    const updatePayload = {
      role_id: roleId,
      module: perm.module,
      can_view: Boolean(perm.can_view),
      can_create: Boolean(perm.can_create),
      can_edit: Boolean(perm.can_edit),
      can_delete: Boolean(perm.can_delete),
      can_approve: Boolean(perm.can_approve),
      can_export: Boolean(perm.can_export),
      can_print: Boolean(perm.can_print),
      can_view_cost: Boolean(perm.can_view_cost),
      data_scope: perm.data_scope || DATA_SCOPES.OWN,
    };

    return {
      updateOne: {
        filter: { role_id: roleId, module: perm.module },
        update: { $set: updatePayload },
        upsert: true,
      },
    };
  });

  if (operations.length > 0) {
    await RolePermission.bulkWrite(operations);
  }

  return getRolePermissions(roleId);
};
