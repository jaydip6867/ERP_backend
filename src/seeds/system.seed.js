import bcrypt from 'bcryptjs';
import { DATA_SCOPES, ERP_MODULES } from '../constants/modules.js';
import { Role } from '../models/role.model.js';
import { RolePermission } from '../models/rolePermission.model.js';
import { User } from '../models/user.model.js';
import { BaseSeeder } from './base.seeder.js';

export const INITIAL_ROLES = [
  {
    role_name: 'Owner',
    role_code: 'OWNER',
    description: 'Enterprise Principal with full unrestricted system-wide authority.',
    is_system_role: true,
    full_access: true,
  },
  {
    role_name: 'Admin',
    role_code: 'ADMIN',
    description: 'System Administrator with full management and configuration authority.',
    is_system_role: true,
    full_access: true,
  },
  {
    role_name: 'Sales Executive',
    role_code: 'SALES_EXECUTIVE',
    description: 'Commercial agent managing customers, quotations, and sales orders.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.OWN },
      { module: 'sales', can_view: true, can_create: true, can_edit: true, can_print: true, data_scope: DATA_SCOPES.OWN },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.BRANCH },
    ],
  },
  {
    role_name: 'Sales Manager',
    role_code: 'SALES_MANAGER',
    description: 'Commercial team head overseeing branch sales, team orders, and quotation approvals.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'sales', can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true, can_print: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'reports', can_view: true, can_export: true, data_scope: DATA_SCOPES.BRANCH },
    ],
  },
  {
    role_name: 'Purchase Manager',
    role_code: 'PURCHASE_MANAGER',
    description: 'Procurement leader overseeing vendors, RFQs, purchase orders, and supplier bills.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'procurement', can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true, can_print: true, can_view_cost: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'warehouse', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'reports', can_view: true, can_export: true, data_scope: DATA_SCOPES.BRANCH },
    ],
  },
  {
    role_name: 'Production Manager',
    role_code: 'PRODUCTION_MANAGER',
    description: 'Operations head directing shop-floor manufacturing, work orders, and bill of materials.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'production', can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true, can_print: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'quality', can_view: true, data_scope: DATA_SCOPES.BRANCH },
    ],
  },
  {
    role_name: 'QC Inspector',
    role_code: 'QC_INSPECTOR',
    description: 'Quality assurance officer conducting inbound, in-line, and final product inspections.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'quality', can_view: true, can_create: true, can_edit: true, can_approve: true, can_print: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'production', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.BRANCH },
    ],
  },
  {
    role_name: 'Warehouse Manager',
    role_code: 'WAREHOUSE_MANAGER',
    description: 'Logistics coordinator managing bins, item stock movements, receipts, and shipments.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'warehouse', can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true, can_print: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'inventory', can_view: true, can_create: true, can_edit: true, can_print: true, data_scope: DATA_SCOPES.BRANCH },
      { module: 'procurement', can_view: true, data_scope: DATA_SCOPES.BRANCH },
    ],
  },
  {
    role_name: 'Accountant',
    role_code: 'ACCOUNTANT',
    description: 'Finance controller managing journal vouchers, general ledger, tax, and accounts audit.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'finance', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, can_print: true, can_view_cost: true, data_scope: DATA_SCOPES.ALL },
      { module: 'sales', can_view: true, can_export: true, can_print: true, can_view_cost: true, data_scope: DATA_SCOPES.ALL },
      { module: 'procurement', can_view: true, can_export: true, can_print: true, can_view_cost: true, data_scope: DATA_SCOPES.ALL },
      { module: 'reports', can_view: true, can_export: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'Marketing Manager',
    role_code: 'MARKETING_MANAGER',
    description: 'Marketing officer coordinating campaigns, lead generation, and brand assets.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'marketing', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, can_print: true, data_scope: DATA_SCOPES.ALL },
      { module: 'sales', can_view: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'Support Executive',
    role_code: 'SUPPORT_EXECUTIVE',
    description: 'Customer service desk representative resolving customer inquiries and tickets.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.OWN },
      { module: 'support', can_view: true, can_create: true, can_edit: true, data_scope: DATA_SCOPES.OWN },
      { module: 'sales', can_view: true, data_scope: DATA_SCOPES.OWN },
    ],
  },
  {
    role_name: 'Assistant',
    role_code: 'ASSISTANT',
    description: 'General support assistant with restricted view-and-print document privileges.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.OWN },
      { module: 'reports', can_view: true, can_print: true, data_scope: DATA_SCOPES.OWN },
    ],
  },
  {
    role_name: 'Board / Founder',
    role_code: 'BOARD_FOUNDER',
    description: 'Founder and Board of Directors with full executive oversight.',
    is_system_role: true,
    full_access: true,
  },
  {
    role_name: 'CEO',
    role_code: 'CEO',
    description: 'Chief Executive Officer with comprehensive enterprise authorization.',
    is_system_role: true,
    full_access: true,
  },
  {
    role_name: 'CRO',
    role_code: 'CRO',
    description: 'Chief Revenue Officer directing company-wide sales, accounts, and commercials.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'dashboards', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'sales', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, can_print: true, data_scope: DATA_SCOPES.ALL },
      { module: 'marketing', can_view: true, can_create: true, can_edit: true, can_approve: true, data_scope: DATA_SCOPES.ALL },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'reports', can_view: true, can_export: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'CMO',
    role_code: 'CMO',
    description: 'Chief Marketing Officer leading corporate brand, campaigns, and digital growth.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'dashboards', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'marketing', can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
      { module: 'sales', can_view: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'COO',
    role_code: 'COO',
    description: 'Chief Operating Officer commanding production, supply chain, and logistics.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'dashboards', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'production', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
      { module: 'procurement', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
      { module: 'inventory', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
      { module: 'warehouse', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
      { module: 'quality', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
      { module: 'operations', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'CFO',
    role_code: 'CFO',
    description: 'Chief Financial Officer overseeing treasury, capital, audits, and taxation.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'dashboards', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'finance', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, can_print: true, can_view_cost: true, can_view_salary: true, data_scope: DATA_SCOPES.ALL },
      { module: 'hr', can_view: true, can_view_salary: true, data_scope: DATA_SCOPES.ALL },
      { module: 'sales', can_view: true, can_view_cost: true, data_scope: DATA_SCOPES.ALL },
      { module: 'procurement', can_view: true, can_view_cost: true, data_scope: DATA_SCOPES.ALL },
      { module: 'reports', can_view: true, can_export: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'CHRO',
    role_code: 'CHRO',
    description: 'Chief Human Resources Officer managing talent, payroll, culture, and compliance.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'dashboards', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'organization', can_view: true, can_create: true, can_edit: true, can_approve: true, data_scope: DATA_SCOPES.ALL },
      { module: 'hr', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, can_print: true, can_view_salary: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'CTO',
    role_code: 'CTO',
    description: 'Chief Technology Officer directing technology architecture, automations, and AI.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'dashboards', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'technology', can_view: true, can_create: true, can_edit: true, can_approve: true, can_run_automation: true, can_manage_integrations: true, data_scope: DATA_SCOPES.ALL },
      { module: 'settings', can_view: true, can_edit: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'CDO',
    role_code: 'CDO',
    description: 'Chief Digital Officer leading digital transformation and analytics.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'technology', can_view: true, can_create: true, can_edit: true, can_run_automation: true, data_scope: DATA_SCOPES.ALL },
      { module: 'marketing', can_view: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'R&D Head',
    role_code: 'RND_HEAD',
    description: 'Head of Research, Development & New Product Development (NPD).',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'dashboards', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'rnd', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, data_scope: DATA_SCOPES.ALL },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'production', can_view: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'Key Account Manager',
    role_code: 'KEY_ACCOUNT_MANAGER',
    description: 'Manages high-value corporate B2B clients and multi-branch contracts.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.OWN },
      { module: 'sales', can_view: true, can_create: true, can_edit: true, can_print: true, data_scope: DATA_SCOPES.TEAM },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'HR Manager',
    role_code: 'HR_MANAGER',
    description: 'People manager managing employee onboarding, leave approvals, and payroll operations.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'organization', can_view: true, can_create: true, can_edit: true, data_scope: DATA_SCOPES.ALL },
      { module: 'hr', can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, can_view_salary: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'Recruiter',
    role_code: 'RECRUITER',
    description: 'Talent acquisition specialist managing job postings, applicants, and candidate interviews.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.OWN },
      { module: 'hr', can_view: true, can_create: true, can_edit: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'HR Executive',
    role_code: 'HR_EXECUTIVE',
    description: 'Human resources associate administering attendance, leaves, and employee queries.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.OWN },
      { module: 'hr', can_view: true, can_create: true, can_edit: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'Technology Manager',
    role_code: 'TECHNOLOGY_MANAGER',
    description: 'Tech systems lead managing ERP health, connectors, and database stability.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'technology', can_view: true, can_create: true, can_edit: true, can_manage_integrations: true, data_scope: DATA_SCOPES.ALL },
      { module: 'settings', can_view: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'Automation Manager',
    role_code: 'AUTOMATION_MANAGER',
    description: 'Automation engineer setting up triggers, webhooks, and WhatsApp bots.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'technology', can_view: true, can_create: true, can_edit: true, can_run_automation: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'BI Analyst',
    role_code: 'BI_ANALYST',
    description: 'Data analytics expert managing intelligence queries and executive BI reports.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'technology', can_view: true, can_create: true, can_edit: true, data_scope: DATA_SCOPES.ALL },
      { module: 'reports', can_view: true, can_export: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'R&D Manager',
    role_code: 'RND_MANAGER',
    description: 'R&D coordinator executing market studies, prototype testing, and problem solving.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.ALL },
      { module: 'rnd', can_view: true, can_create: true, can_edit: true, can_approve: true, data_scope: DATA_SCOPES.ALL },
      { module: 'inventory', can_view: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
  {
    role_name: 'Product Development Executive',
    role_code: 'PRODUCT_DEVELOPMENT_EXECUTIVE',
    description: 'Sampling and technical specification coordinator.',
    is_system_role: false,
    permissions: [
      { module: 'dashboard', can_view: true, data_scope: DATA_SCOPES.OWN },
      { module: 'rnd', can_view: true, can_create: true, can_edit: true, data_scope: DATA_SCOPES.ALL },
    ],
  },
];

/**
 * Seeder for foundational roles and their module permission matrices.
 */
export class SystemRolesSeeder extends BaseSeeder {
  constructor() {
    super('SystemRolesSeeder');
  }

  async run(options = { dryRun: false }) {
    if (options.dryRun) {
      return {
        seededCount: INITIAL_ROLES.length,
        message: `[DRY-RUN] ${INITIAL_ROLES.length} blueprint roles prepared for seeding.`,
      };
    }

    let rolesCreatedOrUpdated = 0;

    for (const roleDef of INITIAL_ROLES) {
      let role = await Role.findOne({ role_code: roleDef.role_code });

      if (!role) {
        role = await Role.create({
          role_name: roleDef.role_name,
          role_code: roleDef.role_code,
          description: roleDef.description,
          is_system_role: roleDef.is_system_role,
          status: 'active',
        });
      } else {
        role.role_name = roleDef.role_name;
        role.description = roleDef.description;
        role.is_system_role = roleDef.is_system_role;
        await role.save();
      }

      rolesCreatedOrUpdated++;

      // Seed permissions for non-super roles (Owner & Admin are dynamically granted ALL via middleware)
      if (!roleDef.full_access && roleDef.permissions) {
        for (const perm of roleDef.permissions) {
          await RolePermission.findOneAndUpdate(
            { role_id: role._id, module: perm.module },
            {
              $set: {
                role_id: role._id,
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
              },
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    return {
      seededCount: rolesCreatedOrUpdated,
      message: `Successfully provisioned ${rolesCreatedOrUpdated} blueprint ERP roles & permission matrices.`,
    };
  }

  async clear() {
    await RolePermission.deleteMany({});
    await Role.deleteMany({ is_system_role: false });
  }
}

/**
 * Seeder: Administrator Account associated with the ADMIN system role.
 */
export class AdminUserSeeder extends BaseSeeder {
  constructor() {
    super('AdminUserSeeder');
  }

  async run(options = { dryRun: false }) {
    const adminEmail = 'admin@danzaerp.com';

    if (options.dryRun) {
      return {
        seededCount: 1,
        message: `[DRY-RUN] Admin user blueprint prepared for ${adminEmail}`,
      };
    }

    const adminRole = await Role.findOne({ role_code: 'ADMIN' });
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (adminRole && (!existingAdmin.role_id || existingAdmin.role_id.toString() !== adminRole._id.toString())) {
        existingAdmin.role_id = adminRole._id;
        await existingAdmin.save({ validateBeforeSave: false });
      }
      return {
        seededCount: 1,
        message: `Admin user ${adminEmail} updated with ADMIN role (${adminRole?._id}).`,
      };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123456', salt);

    await User.create({
      user_code: 'USR-ADMIN-001',
      full_name: 'System Administrator',
      email: adminEmail,
      mobile: '+1-555-0199',
      password_hash: passwordHash,
      role_id: adminRole ? adminRole._id : null,
      department: 'Executive Leadership',
      designation: 'Chief Technology Officer',
      status: 'active',
      employee_type: 'full_time',
      language: 'en',
      timezone: 'UTC',
      default_dashboard: 'standard',
      joining_date: new Date(),
    });

    return {
      seededCount: 1,
      message: `Admin user ${adminEmail} successfully created with ADMIN role.`,
    };
  }

  async clear() {
    await User.deleteOne({ email: 'admin@danzaerp.com' });
  }
}
